import { Router } from 'express';
import { deleteAccount, getAccountById, listAccounts } from '../services/accountService.js';
import { env } from '../config/env.js';
import {
	createGoogleAuthorizationRequest,
	completeGoogleAccountLink,
	getGoogleIntegrationStatus,
} from '../services/googleOAuthService.js';
import {
	createOneDriveAuthorizationRequest,
	completeOneDriveAccountLink,
	getOneDriveIntegrationStatus,
} from '../services/oneDriveOAuthService.js';
import {
	createDropboxAuthorizationRequest,
	completeDropboxAccountLink,
	getDropboxIntegrationStatus,
} from '../services/dropboxOAuthService.js';
import { connectMegaAccount, getMegaIntegrationStatus } from '../services/megaAccountService.js';
import { clearFilesForAccount } from '../services/fileService.js';

const router = Router();

router.get('/accounts', (_req, res) => {
	const accounts = listAccounts().map((account) => ({
		...account,
		free_space: Number(account.total_space) - Number(account.used_space),
	}));

	res.json({ data: accounts });
});

router.get('/accounts/google/status', (_req, res) => {
	res.json({ data: getGoogleIntegrationStatus() });
});

router.get('/accounts/onedrive/status', (_req, res) => {
	res.json({ data: getOneDriveIntegrationStatus() });
});

router.get('/accounts/dropbox/status', (_req, res) => {
	res.json({ data: getDropboxIntegrationStatus() });
});

router.get('/accounts/mega/status', (_req, res) => {
	res.json({ data: getMegaIntegrationStatus() });
});

router.get('/accounts/google/connect', (_req, res, next) => {
	try {
		const data = createGoogleAuthorizationRequest();
		res.json({ data });
	} catch (error) {
		next(error);
	}
});

router.get('/accounts/onedrive/connect', (_req, res, next) => {
	try {
		const data = createOneDriveAuthorizationRequest();
		res.json({ data });
	} catch (error) {
		next(error);
	}
});

router.get('/accounts/dropbox/connect', (_req, res, next) => {
	try {
		const data = createDropboxAuthorizationRequest();
		res.json({ data });
	} catch (error) {
		next(error);
	}
});

router.post('/accounts/mega/connect', async (req, res, next) => {
	try {
		const data = await connectMegaAccount(req.body || {});
		res.json({ data });
	} catch (error) {
		next(error);
	}
});

router.get('/accounts/google/callback', async (req, res) => {
	const frontendUrl = new URL(env.frontendUrl);

	try {
		const { code, state, error } = req.query;

		if (error) {
			frontendUrl.searchParams.set('google', 'error');
			frontendUrl.searchParams.set('message', String(error));
			return res.redirect(frontendUrl.toString());
		}

		await completeGoogleAccountLink({ code: String(code || ''), state: String(state || '') });
		frontendUrl.searchParams.set('google', 'connected');
		return res.redirect(frontendUrl.toString());
	} catch (error) {
		frontendUrl.searchParams.set('google', 'error');
		frontendUrl.searchParams.set('message', error.message);
		return res.redirect(frontendUrl.toString());
	}
});

router.get('/accounts/onedrive/callback', async (req, res) => {
	const frontendUrl = new URL(env.frontendUrl);

	try {
		const { code, state, error } = req.query;

		if (error) {
			frontendUrl.searchParams.set('onedrive', 'error');
			frontendUrl.searchParams.set('message', String(error));
			return res.redirect(frontendUrl.toString());
		}

		await completeOneDriveAccountLink({ code: String(code || ''), state: String(state || '') });
		frontendUrl.searchParams.set('onedrive', 'connected');
		return res.redirect(frontendUrl.toString());
	} catch (error) {
		frontendUrl.searchParams.set('onedrive', 'error');
		frontendUrl.searchParams.set('message', error.message);
		return res.redirect(frontendUrl.toString());
	}
});

router.get('/accounts/dropbox/callback', async (req, res) => {
	const frontendUrl = new URL(env.frontendUrl);

	try {
		const { code, state, error, error_description } = req.query;

		if (error) {
			frontendUrl.searchParams.set('dropbox', 'error');
			frontendUrl.searchParams.set('message', String(error_description || error));
			return res.redirect(frontendUrl.toString());
		}

		await completeDropboxAccountLink({ code: String(code || ''), state: String(state || '') });
		frontendUrl.searchParams.set('dropbox', 'connected');
		return res.redirect(frontendUrl.toString());
	} catch (error) {
		frontendUrl.searchParams.set('dropbox', 'error');
		frontendUrl.searchParams.set('message', error.message);
		return res.redirect(frontendUrl.toString());
	}
});

router.delete('/accounts/:id', (req, res) => {
	const account = getAccountById(req.params.id);
	if (!account) {
		return res.status(404).json({ error: 'Account not found' });
	}

	clearFilesForAccount(account.id);
	deleteAccount(account.id);

	return res.json({ data: { success: true } });
});

export default router;
