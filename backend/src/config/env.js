import dotenv from 'dotenv';
import os from 'os';
import crypto from 'crypto';

dotenv.config();

const machineFingerprint = crypto
	.createHash('sha256')
	.update(`${os.hostname()}|${os.platform()}|${os.arch()}`)
	.digest('hex');

const envHalf = process.env.OMNICLOUD_SECRET_HALF || 'omnicloud-dev-secret-half';
const derivedKeyMaterial = `${envHalf}:${machineFingerprint}`;
const encryptionKey = crypto.createHash('sha256').update(derivedKeyMaterial).digest();

export const env = {
	port: Number(process.env.PORT || 8787),
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	syncIntervalMinutes: Number(process.env.SYNC_INTERVAL_MINUTES || 5),
	encryptionKey,
	frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
	googleClientId: process.env.GOOGLE_CLIENT_ID || '',
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
	googleRedirectUri:
		process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8787/api/accounts/google/callback',
	onedriveClientId: process.env.ONEDRIVE_CLIENT_ID || '',
	onedriveClientSecret: process.env.ONEDRIVE_CLIENT_SECRET || '',
	onedriveTenantId: process.env.ONEDRIVE_TENANT_ID || 'common',
	onedriveRedirectUri:
		process.env.ONEDRIVE_REDIRECT_URI || 'http://localhost:8787/api/accounts/onedrive/callback',
	dropboxClientId: process.env.DROPBOX_CLIENT_ID || '',
	dropboxClientSecret: process.env.DROPBOX_CLIENT_SECRET || '',
	dropboxRedirectUri:
		process.env.DROPBOX_REDIRECT_URI || 'http://localhost:8787/api/accounts/dropbox/callback',
};

export function redactEnv() {
	return {
		port: env.port,
		corsOrigin: env.corsOrigin,
		syncIntervalMinutes: env.syncIntervalMinutes,
		frontendUrl: env.frontendUrl,
		googleClientId: env.googleClientId ? '[configured]' : '[missing]',
		googleRedirectUri: env.googleRedirectUri,
		onedriveClientId: env.onedriveClientId ? '[configured]' : '[missing]',
		onedriveTenantId: env.onedriveTenantId,
		onedriveRedirectUri: env.onedriveRedirectUri,
		dropboxClientId: env.dropboxClientId ? '[configured]' : '[missing]',
		dropboxRedirectUri: env.dropboxRedirectUri,
	};
}
