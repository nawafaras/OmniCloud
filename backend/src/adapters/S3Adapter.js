import { BaseCloudAdapter } from './BaseCloudAdapter.js';

export class S3Adapter extends BaseCloudAdapter {
	async fetchStructure() {
		return [];
	}
}
