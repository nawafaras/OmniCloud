<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
	IconBrandGoogleDrive,
	IconChevronRight,
	IconHelp,
	IconHome,
	IconLayoutGrid,
	IconMenu2,
	IconMoon,
	IconPlus,
	IconSearch,
	IconSettings,
	IconSun,
	IconStar,
	IconTrash,
	IconUsers,
	IconX,
	IconClockHour4,
	IconAdjustmentsHorizontal,
	IconCloud,
	IconFolder,
	IconCloudFilled,
	IconClockHour4Filled,
	IconFolderFilled,
	IconHomeFilled,
	IconStarFilled,
	IconUserFilled,
} from '@tabler/icons-vue';
import { useAccountManagementStore } from '../stores/accountManagement';

const props = defineProps({
	currentSection: { type: String, required: true },
});

const emit = defineEmits(['new-folder', 'upload-files', 'upload-folder']);

const isCreateMenuOpen = ref(false);
const isMobileNavOpen = ref(false);
const createMenuRef = ref(null);
const theme = ref('light');
const accountStore = useAccountManagementStore();
const { accounts } = storeToRefs(accountStore);

const totalUsed = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.used_space || 0), 0));
const totalSpace = computed(() => accounts.value.reduce((sum, account) => sum + Number(account.total_space || 0), 0));
const storagePercent = computed(() => (totalSpace.value ? Math.min(100, (totalUsed.value / totalSpace.value) * 100) : 0));
const storageLabel = computed(() => `${formatBytes(totalUsed.value)} dari ${formatBytes(totalSpace.value)} telah digunakan`);

function formatBytes(value) {
	if (!value) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let amount = Number(value);
	let index = 0;
	while (amount >= 1024 && index < units.length - 1) {
		amount /= 1024;
		index += 1;
	}
	return `${amount.toFixed(amount >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function toggleCreateMenu() {
	isCreateMenuOpen.value = !isCreateMenuOpen.value;
}

function toggleMobileNav() {
	isMobileNavOpen.value = !isMobileNavOpen.value;
}

function closeMobileNav() {
	isMobileNavOpen.value = false;
}

function runCreateAction(action) {
	isCreateMenuOpen.value = false;
	isMobileNavOpen.value = false;
	emit(action);
}

function handleDocumentClick(event) {
	if (!createMenuRef.value?.contains(event.target)) {
		isCreateMenuOpen.value = false;
	}

	if (isMobileNavOpen.value && !event.target.closest('[data-mobile-nav-card]') && !event.target.closest('[data-mobile-nav-toggle]')) {
		isMobileNavOpen.value = false;
	}
}

function applyTheme(nextTheme) {
	theme.value = nextTheme;
	document.documentElement.classList.toggle('dark', nextTheme === 'dark');
	window.localStorage.setItem('omnicloud-theme', nextTheme);
}

function toggleTheme() {
	applyTheme(theme.value === 'dark' ? 'light' : 'dark');
}

onMounted(() => {
	theme.value = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	document.addEventListener('click', handleDocumentClick);
	if (!accounts.value.length) {
		accountStore.loadAccounts();
	}
});

onBeforeUnmount(() => {
	document.removeEventListener('click', handleDocumentClick);
});

const navItems = [
	{ id: 'home', label: 'Beranda', icon: IconHome, activeIcon: IconHomeFilled, to: '/' },
	{ id: 'drive', label: 'Drive Saya', icon: IconFolder, activeIcon: IconFolderFilled, to: '/my-drive' },
	{ id: 'shared', label: 'Dibagikan', icon: IconUsers, activeIcon: IconUserFilled, to: '/my-drive' },
	{ id: 'recent', label: 'Terbaru', icon: IconClockHour4, activeIcon: IconClockHour4Filled, to: '/my-drive' },
	{ id: 'starred', label: 'Berbintang', icon: IconStar, activeIcon: IconStarFilled, to: '/my-drive' },
	{ id: 'storage', label: 'Penyimpanan', icon: IconCloud, activeIcon: IconCloudFilled, to: '/quota' },
];
</script>

<template>
	<div class="min-h-screen bg-[#f8fafd] text-[#202124] dark:bg-slate-900 dark:text-slate-100">
		<header class="grid h-16 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-3 sm:gap-4 sm:px-4 lg:grid-cols-[244px_minmax(320px,720px)_1fr] lg:gap-3 lg:pr-4">
			<div class="flex min-w-0 items-center gap-2 lg:gap-3.5 lg:pl-1">
				<button type="button" class="grid size-10 shrink-0 place-items-center rounded-full text-[#5f6368] transition hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 lg:hidden" data-mobile-nav-toggle aria-label="Buka menu navigasi" @click.stop="toggleMobileNav">
					<IconMenu2 :size="22" :stroke="2" />
				</button>
				<div class="hidden items-center gap-2 lg:flex">
					<IconBrandGoogleDrive :size="28" :stroke="1.8" class="text-[#1a73e8]" />
					<div class="text-[22px] font-medium text-[#5f6368] dark:text-slate-300">OmniCloud</div>
				</div>
			</div>

			<div class="grid h-11 min-w-0 max-w-full grid-cols-[44px_minmax(0,1fr)_42px] items-center rounded-full bg-[#eaf1fb] pr-1.5 dark:bg-slate-800/90 sm:h-12 sm:grid-cols-[52px_minmax(0,1fr)_48px] sm:pr-2.5">
				<span class="grid place-items-center text-[#5f6368] dark:text-slate-400">
					<IconSearch :size="18" :stroke="2" />
				</span>
				<input type="search" placeholder="Telusuri di OmniCloud" class="w-full min-w-0 border-0 bg-transparent text-sm text-[#202124] outline-none placeholder:text-[#5f6368] dark:text-slate-100 dark:placeholder:text-slate-400 sm:text-base" />
				<span class="grid place-items-center text-[#5f6368] dark:text-slate-400">
					<IconAdjustmentsHorizontal :size="18" :stroke="2" />
				</span>
			</div>

			<div class="hidden items-center justify-end gap-2 lg:flex">
				<button type="button" class="hidden size-10 place-items-center rounded-full text-[#5f6368] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 sm:grid" @click="toggleTheme">
					<IconMoon v-if="theme !== 'dark'" :size="18" :stroke="2" />
					<IconSun v-else :size="18" :stroke="2" />
				</button>
				<button type="button" class="hidden size-10 place-items-center rounded-full text-[#5f6368] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 sm:grid">
					<IconHelp :size="18" :stroke="2" />
				</button>
				<button type="button" class="hidden size-10 place-items-center rounded-full text-[#5f6368] hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10 sm:grid">
					<IconSettings :size="18" :stroke="2" />
				</button>
			</div>
		</header>

		<Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-2 opacity-0 scale-95" enter-to-class="translate-y-0 opacity-100 scale-100" leave-active-class="transition duration-150 ease-in" leave-from-class="translate-y-0 opacity-100 scale-100" leave-to-class="-translate-y-2 opacity-0 scale-95">
			<div v-if="isMobileNavOpen" class="fixed left-2 right-2 top-16 z-50 lg:hidden" data-mobile-nav-card>
				<div class="max-h-[calc(100vh-16px)] overflow-y-auto rounded-[28px] border border-[#dfe6f1] bg-white/95 p-4 text-[#202124] shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100">
					<div class="mb-5 flex items-center justify-between gap-3">
						<div class="flex items-center gap-2">
							<IconBrandGoogleDrive :size="28" :stroke="1.8" class="text-[#1a73e8]" />
							<span class="text-xl font-semibold text-[#5f6368] dark:text-slate-300">OmniCloud</span>
						</div>
						<button type="button" class="grid size-10 place-items-center rounded-full text-[#5f6368] transition hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10" aria-label="Tutup menu navigasi" @click="closeMobileNav">
							<IconX :size="20" :stroke="2" />
						</button>
					</div>

					<div ref="createMenuRef" class="relative mb-4">
						<button type="button" class="flex h-13 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#1a73e8] to-[#4f8ff7] px-4 font-semibold text-white shadow-[0_12px_28px_rgba(26,115,232,0.28)]" @click.stop="toggleCreateMenu">
							<IconPlus :size="22" :stroke="2" />
							<span>Baru</span>
						</button>

						<div v-if="isCreateMenuOpen" class="absolute left-0 top-[calc(100%+10px)] z-30 w-full overflow-hidden rounded-2xl border border-[#e0e3e7] bg-white py-2 shadow-[0_12px_36px_rgba(60,64,67,0.2)] dark:border-slate-700 dark:bg-slate-800">
							<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('new-folder')">
								<span>Folder Baru</span>
								<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
							</button>
							<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('upload-files')">
								<span>Upload File</span>
								<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
							</button>
							<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('upload-folder')">
								<span>Upload Folder</span>
								<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
							</button>
						</div>
					</div>

					<nav class="flex flex-col gap-1">
						<RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="group relative flex h-12 items-center gap-3.5 overflow-hidden rounded-2xl px-4 text-[#202124] transition-all duration-200 dark:text-slate-100" :class="props.currentSection === item.id ? 'bg-gradient-to-r from-[#d3e3fd] to-[#eef5ff] font-semibold text-[#174ea6] shadow-[inset_4px_0_0_#1a73e8] dark:from-blue-500/20 dark:to-slate-700/80 dark:text-blue-200 dark:shadow-[inset_4px_0_0_#60a5fa]' : 'hover:bg-black/[0.03] hover:pl-5 dark:hover:bg-white/6'" @click="closeMobileNav">
							<component :is="props.currentSection === item.id ? item.activeIcon : item.icon" :size="20" :stroke="props.currentSection === item.id ? 0 : 2" class="shrink-0 transition-transform duration-200 group-hover:scale-110" :class="props.currentSection === item.id ? 'text-[#1a73e8] drop-shadow-sm dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'" />
							<span>{{ item.label }}</span>
						</RouterLink>
					</nav>

					<div class="mt-4 rounded-[24px] border border-[#dfe6f1] bg-[#f8fafd] p-4 dark:border-slate-700 dark:bg-slate-800/80">
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="flex items-center gap-2.5">
								<span class="grid size-9 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300">
									<IconCloudFilled :size="18" :stroke="0" />
								</span>
								<span class="text-sm font-semibold">Penyimpanan</span>
							</div>
							<span class="rounded-full bg-[#e8f0fe] px-2 py-1 text-xs font-semibold text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300">{{ storagePercent.toFixed(0) }}%</span>
						</div>

						<div class="mb-2 h-2 overflow-hidden rounded-full bg-[#dfe6f1] dark:bg-slate-700">
							<div class="h-full rounded-full bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#06b6d4] transition-all" :style="{ width: `${storagePercent}%` }" />
						</div>

						<p class="text-xs leading-5 text-[#5f6368] dark:text-slate-400">{{ storageLabel }}</p>
					</div>
				</div>
			</div>
		</Transition>

		<div class="grid grid-cols-1 gap-3 lg:grid-cols-[256px_minmax(0,1fr)]">
			<aside class="hidden pb-6 pl-4 pr-3 pt-2 lg:flex lg:min-h-[calc(100vh-4rem)] lg:flex-col">
				<div ref="createMenuRef" class="relative inline-block">
					<button type="button" class="inline-flex h-14 items-center gap-3.5 rounded-2xl bg-white px-[18px] pr-[22px] font-medium text-[#3c4043] shadow-[0_1px_3px_rgba(60,64,67,0.3),0_4px_8px_rgba(60,64,67,0.15)] dark:bg-slate-800 dark:text-slate-100 dark:shadow-[0_10px_30px_rgba(15,23,42,0.45)]" @click.stop="toggleCreateMenu">
						<IconPlus :size="22" :stroke="2" />
						<span>Baru</span>
					</button>

					<div v-if="isCreateMenuOpen" class="absolute left-0 top-[calc(100%+10px)] z-30 w-56 overflow-hidden rounded-2xl border border-[#e0e3e7] bg-white py-2 shadow-[0_12px_36px_rgba(60,64,67,0.2)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_12px_36px_rgba(15,23,42,0.45)]">
						<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('new-folder')">
							<span>Folder Baru</span>
							<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
						</button>
						<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('upload-files')">
							<span>Upload File</span>
							<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
						</button>
						<button type="button" class="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[#202124] hover:bg-[#f8fafd] dark:text-slate-100 dark:hover:bg-slate-700/70" @click="runCreateAction('upload-folder')">
							<span>Upload Folder</span>
							<IconChevronRight :size="16" :stroke="2" class="text-[#5f6368] dark:text-slate-400" />
						</button>
					</div>
				</div>

				<nav class="-ml-4 -mr-3 mt-[18px] flex flex-col gap-0.5">
					<RouterLink v-for="item in navItems" :key="item.label" :to="item.to" class="group relative mr-3 flex h-10 items-center gap-3.5 overflow-hidden rounded-r-[20px] px-6 text-[#202124] transition-all duration-200 dark:text-slate-100" :class="props.currentSection === item.id ? 'bg-gradient-to-r from-[#d3e3fd] to-[#eef5ff] font-semibold text-[#174ea6] shadow-[inset_4px_0_0_#1a73e8] dark:from-blue-500/20 dark:to-slate-700/80 dark:text-blue-200 dark:shadow-[inset_4px_0_0_#60a5fa]' : 'hover:bg-black/[0.03] hover:pl-7 dark:hover:bg-white/6'">
						<component :is="props.currentSection === item.id ? item.activeIcon : item.icon" :size="18" :stroke="props.currentSection === item.id ? 0 : 2" class="shrink-0 transition-transform duration-200 group-hover:scale-110" :class="props.currentSection === item.id ? 'text-[#1a73e8] drop-shadow-sm dark:text-blue-300' : 'text-[#5f6368] dark:text-slate-400'" />
						<span>{{ item.label }}</span>
					</RouterLink>
				</nav>

				<RouterLink to="/quota" class="sticky bottom-4 mt-auto block rounded-[24px] border border-[#dfe6f1] bg-white/70 p-4 text-[#202124] shadow-[0_12px_32px_rgba(60,64,67,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_16px_40px_rgba(60,64,67,0.14)] dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800">
					<div class="mb-3 flex items-center justify-between gap-3">
						<div class="flex items-center gap-2.5">
							<span class="grid size-9 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300">
								<IconCloud :size="18" :stroke="2" />
							</span>
							<span class="text-sm font-semibold">Penyimpanan</span>
						</div>
						<span class="rounded-full bg-[#e8f0fe] px-2 py-1 text-xs font-semibold text-[#1a73e8] dark:bg-blue-500/15 dark:text-blue-300">{{ storagePercent.toFixed(0) }}%</span>
					</div>

					<div class="mb-2 h-2 overflow-hidden rounded-full bg-[#dfe6f1] dark:bg-slate-700">
						<div class="h-full rounded-full bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#06b6d4] transition-all" :style="{ width: `${storagePercent}%` }" />
					</div>

					<p class="text-xs leading-5 text-[#5f6368] dark:text-slate-400">{{ storageLabel }}</p>
				</RouterLink>

			</aside>

			<main class="px-2 pb-4 lg:px-0 lg:pr-4 lg:pb-5">
				<slot />
			</main>
		</div>
	</div>
</template>