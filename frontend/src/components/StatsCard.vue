<script setup>
defineProps({
	label: { type: String, required: true },
	value: { type: [String, Number], required: true },
	hint: { type: String, default: '' },
});
</script>

<template>
	<article class="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur">
		<p class="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f6368]">{{ label }}</p>
		<strong class="mt-2 block text-2xl font-bold text-[#202124]">{{ value }}</strong>
		<small class="mt-1 block text-sm text-[#5f6368]">{{ hint }}</small>
	</article>
</template>
