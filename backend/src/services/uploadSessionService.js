import { randomUUID } from 'crypto';

const sessions = new Map();

export function createUploadSession(payload) {
	const id = randomUUID();
	const session = {
		id,
		...payload,
		token: randomUUID(),
		status: 'pending',
		createdAt: new Date().toISOString(),
	};

	sessions.set(id, session);
	return session;
}

export function getUploadSession(id) {
	return sessions.get(id);
}

export function updateUploadSession(id, patch) {
	const session = sessions.get(id);
	if (!session) return null;
	const next = { ...session, ...patch };
	sessions.set(id, next);
	return next;
}

export function removeUploadSession(id) {
	sessions.delete(id);
}
