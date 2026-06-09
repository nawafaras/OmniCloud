import http from 'http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { registerUploadSocket, unregisterUploadSocket } from './services/websocketHub.js';
import { runDeltaSync, scheduleSync } from './services/syncService.js';

const app = createApp();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/uploads' });

wss.on('connection', (socket, request) => {
	const url = new URL(request.url, `http://${request.headers.host}`);
	const uploadId = url.searchParams.get('uploadId');

	if (!uploadId) {
		socket.close(1008, 'uploadId is required');
		return;
	}

	registerUploadSocket(uploadId, socket);

	socket.send(
		JSON.stringify({
			type: 'socket:ready',
			uploadId,
			status: 'connected',
		}),
	);

	socket.on('close', () => {
		unregisterUploadSocket(uploadId, socket);
	});
});

scheduleSync();
runDeltaSync().catch((error) => {
	console.error('Initial sync failed:', error);
});

server.listen(env.port, () => {
	console.log(`OmniCloud API listening on http://localhost:${env.port}`);
});
