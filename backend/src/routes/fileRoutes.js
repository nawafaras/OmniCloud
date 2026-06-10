import { Router } from 'express';
import { listFilesByPath, getFileById, getFileByRemoteId, listRecentFiles, listStarredFiles, setFileStarred, updateFileStarredByRemoteId } from '../services/fileService.js';
import { getAccountById, getActiveAccounts } from '../services/accountService.js';
import { createAdapter } from '../services/adapterRegistry.js';
import { selectBestAccount } from '../services/spaceAllocator.js';
import { syncAccount } from '../services/syncService.js';

const router = Router();

function encodeSharedFileId(accountId, remoteFileId) {
	return `shared:${accountId}:${Buffer.from(String(remoteFileId)).toString('base64url')}`;
}

function mapSharedItem(account, item, localFile = getFileByRemoteId(account.id, item.remote_file_id)) {
	return {
		...(localFile || {}),
		...item,
		id: encodeSharedFileId(account.id, item.remote_file_id),
		cloud_account_id: account.id,
		provider: localFile?.provider || account.provider,
		email: item.owner_email || localFile?.email || account.email,
		createdTime: item.createdTime,
		modifiedTime: item.modifiedTime,
		capabilities: localFile?.capabilities || { starred: account.provider === 'google_drive' },
	};
}

function decodeSharedFileId(fileId) {
	if (!fileId?.startsWith('shared:')) return null;
	const [, accountId, encodedRemoteFileId] = fileId.split(':');
	if (!accountId || !encodedRemoteFileId) return null;
	return {
		accountId,
		remoteFileId: Buffer.from(encodedRemoteFileId, 'base64url').toString('utf8'),
	};
}

async function getSharedFileContext(fileId) {
	const parsed = decodeSharedFileId(fileId);
	if (!parsed) {
		return { file: null, account: null, adapter: null };
	}

	const account = getAccountById(parsed.accountId);
	if (!account) {
		return { file: null, account: null, adapter: null };
	}

	const adapter = createAdapter(account);
	const sharedItems = await adapter.listSharedWithMe();
	let file = sharedItems.find((item) => item.remote_file_id === parsed.remoteFileId);
	if (!file) {
		try {
			const details = await adapter.getFileDetails({ remote_file_id: parsed.remoteFileId });
			if (details?.remote_file_id) {
				file = {
					file_name: details.file_name || details.name,
					is_folder: Boolean(details.is_folder),
					is_starred: 0,
					size: Number(details.size || 0),
					mime_type: details.mime_type || details.mimeType || null,
					remote_file_id: details.remote_file_id,
					remote_parent_id: details.remote_parent_id || null,
					remote_drive_id: details.remote_drive_id || null,
					createdTime: details.createdTime || null,
					modifiedTime: details.modifiedTime || null,
					owner_name: details.owner_name || null,
					owner_email: details.owner_email || account.email,
				};
			}
		} catch {
			file = null;
		}
	}
	if (!file) {
		return { file: null, account, adapter };
	}

	return {
		file: {
			...file,
			id: fileId,
			cloud_account_id: account.id,
			provider: account.provider,
			email: file.owner_email || account.email,
			capabilities: {
				starred: account.provider === 'google_drive',
			},
		},
		account,
		adapter,
	};
}

async function getFileContext(fileId) {
	const file = getFileById(fileId);
	if (!file) {
		return getSharedFileContext(fileId);
	}

	const account = getAccountById(file.cloud_account_id);
	if (!account) {
		return { file, account: null, adapter: null };
	}

	return {
		file,
		account,
		adapter: createAdapter(account),
	};
}

function ensureFileContext(context, res) {
	if (!context.file) {
		res.status(404).json({ error: 'File not found' });
		return false;
	}

	if (!context.account || context.account.status !== 'active' || !context.adapter) {
		res.status(409).json({ error: 'The file account is no longer connected' });
		return false;
	}

	return true;
}

async function listSharedWithMeFiles() {
	const accounts = getActiveAccounts();
	const settled = await Promise.allSettled(accounts.map(async (account) => {
		const adapter = createAdapter(account);
		const items = await adapter.listSharedWithMe();

		return items
			.map((item) => mapSharedItem(account, item))
			.filter((item) => Boolean(item.remote_file_id));
	}));

	return settled
		.filter((result) => result.status === 'fulfilled')
		.flatMap((result) => result.value)
		.sort((left, right) => {
			const leftTime = new Date(left.modifiedTime || left.createdTime || 0).getTime();
			const rightTime = new Date(right.modifiedTime || right.createdTime || 0).getTime();
			if (leftTime !== rightTime) return rightTime - leftTime;
			return (left.file_name || '').localeCompare(right.file_name || '', 'id');
		});
}

router.get('/files', async (req, res, next) => {
	try {
		const files = req.query.starred === '1'
			? listStarredFiles()
			: req.query.recent === '1'
				? listRecentFiles()
				: req.query.shared === '1'
					? await listSharedWithMeFiles()
					: listFilesByPath(req.query.path || '/');
		res.json({ data: files });
	} catch (error) {
		next(error);
	}
});

router.get('/files/:id/shared-children', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		if (!context.file.is_folder) {
			return res.status(400).json({ error: 'Only folders can be opened' });
		}

		const items = await context.adapter.listSharedFolderChildren(context.file);
		return res.json({
			data: items.map((item) => mapSharedItem(context.account, item)).filter((item) => Boolean(item.remote_file_id)),
		});
	} catch (error) {
		next(error);
	}
});

router.patch('/files/:id/star', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		const isStarred = Boolean(req.body?.is_starred ?? req.body?.isStarred ?? true);
		const supportsStarred = Boolean(context.adapter.getCapabilities?.().starred);

		if (supportsStarred) {
			await context.adapter.setFileStarred(context.file, isStarred);
			await syncAccount(context.account);
			if (!decodeSharedFileId(context.file.id)) {
				updateFileStarredByRemoteId(context.account.id, context.file.remote_file_id, isStarred);
			}
		} else {
			setFileStarred(context.file.id, isStarred);
		}
		return res.json({ data: { success: true, is_starred: isStarred, provider_sync: supportsStarred } });
	} catch (error) {
		next(error);
	}
});

router.post('/files/bulk/delete', async (req, res, next) => {
	try {
		const ids = Array.isArray(req.body?.ids) ? [...new Set(req.body.ids.filter(Boolean))] : [];
		if (!ids.length) {
			return res.status(400).json({ error: 'At least one file id is required' });
		}

		const contexts = await Promise.all(ids.map(async (id) => ({ id, ...await getFileContext(id) })));
		const invalid = contexts.find((context) => !context.file || !context.account || context.account.status !== 'active' || !context.adapter);
		if (invalid) {
			return res.status(invalid.file ? 409 : 404).json({ error: invalid.file ? 'One or more file accounts are no longer connected' : 'One or more files were not found' });
		}

		const touchedAccountIds = new Set();
		for (const context of contexts) {
			await context.adapter.deleteFile(context.file);
			touchedAccountIds.add(context.account.id);
		}

		for (const accountId of touchedAccountIds) {
			const account = getAccountById(accountId);
			if (account) {
				await syncAccount(account);
			}
		}

		return res.json({ data: { success: true, count: contexts.length } });
	} catch (error) {
		next(error);
	}
});

router.get('/files/:id', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		const details = await context.adapter.getFileDetails(context.file);
		return res.json({
			data: {
				...context.file,
				...details,
			},
		});
	} catch (error) {
		next(error);
	}
});

router.get('/files/:id/download', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}
		const stream = await context.adapter.getDownloadStream(context.file);

		res.setHeader('Content-Disposition', `attachment; filename="${context.file.file_name}"`);
		res.setHeader('Content-Type', context.file.mime_type || 'application/octet-stream');
		if (!context.file.is_folder && context.file.size) {
			res.setHeader('Content-Length', String(context.file.size));
		}
		stream.pipe(res);
	} catch (error) {
		next(error);
	}
});

router.get('/files/:id/preview', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		if (context.file.is_folder) {
			return res.status(400).json({ error: 'Folder preview is not supported' });
		}

		const mimeType = context.file.mime_type || 'application/octet-stream';
		const isPreviewable = /^(image|video|audio|text)\//.test(mimeType)
			|| mimeType === 'application/pdf'
			|| mimeType === 'application/json';

		if (!isPreviewable) {
			return res.status(415).json({ error: 'Preview is not supported for this file type' });
		}

		const stream = await context.adapter.getDownloadStream(context.file);

		res.setHeader('Content-Disposition', `inline; filename="${context.file.file_name}"`);
		res.setHeader('Content-Type', mimeType);
		if (context.file.size) {
			res.setHeader('Content-Length', String(context.file.size));
		}

		stream.pipe(res);
	} catch (error) {
		next(error);
	}
});

router.patch('/files/:id/rename', async (req, res, next) => {
	try {
		const { name } = req.body;
		if (!name?.trim()) {
			return res.status(400).json({ error: 'New name is required' });
		}

		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		await context.adapter.renameFile(context.file, name.trim());
		await syncAccount(context.account);

		return res.json({ data: { success: true } });
	} catch (error) {
		next(error);
	}
});

router.delete('/files/:id', async (req, res, next) => {
	try {
		const context = await getFileContext(req.params.id);
		if (!ensureFileContext(context, res)) {
			return;
		}

		await context.adapter.deleteFile(context.file);
		await syncAccount(context.account);

		return res.json({ data: { success: true } });
	} catch (error) {
		next(error);
	}
});

router.post('/files/folders', async (req, res, next) => {
	try {
		const { name, virtual_path = '/' } = req.body;

		if (!name?.trim()) {
			return res.status(400).json({ error: 'Folder name is required' });
		}

		const { selected } = selectBestAccount(0);
		const account = getAccountById(selected.id);
		const adapter = createAdapter(account);

		await adapter.createFolder({
			name: name.trim(),
			virtualPath: virtual_path,
		});

		await syncAccount(account);

		return res.status(201).json({ data: { success: true } });
	} catch (error) {
		next(error);
	}
});

export default router;
