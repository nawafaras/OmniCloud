import { getActiveAccounts } from './accountService.js';

export function selectBestAccount(requiredBytes) {
	const accounts = getActiveAccounts()
		.map((account) => ({
			...account,
			freeSpace: Number(account.total_space) - Number(account.used_space),
		}))
		.sort((a, b) => b.freeSpace - a.freeSpace);

	const selected = accounts.find((account) => account.freeSpace >= requiredBytes) || accounts[0];

	if (!selected) {
		throw new Error('No active cloud account available');
	}

	return {
		selected,
		fallbackChain: accounts.filter((account) => account.id !== selected.id),
	};
}
