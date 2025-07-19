<script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import '@fontsource-variable/atkinson-hyperlegible-next';

	let { children } = $props();
</script>

<div class="flex h-full flex-col">
	<div
		class="box-neon-bottom-big neon neon-xl neon-secondary outline-glow-secondary-base grid h-fit w-screen grid-cols-3 content-center outline"
	>
		<div></div>
		<a href="/" class="content-center text-center font-light">
			{#if page.url.pathname !== '/'}
				identity crisis
			{/if}
		</a>
		<div class="justify-self-end">
			<a
				href="/profile"
				class="hover:bg-glow-secondary-base/10 flex rounded-l-2xl py-1 pr-2 pl-4 transition"
			>
				<span class="pr-1"> Profile </span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-user-icon lucide-user"
					><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle
						cx="12"
						cy="7"
						r="4"
					/></svg
				>
			</a>
		</div>
	</div>
	<div class="flex-1">{@render children()}</div>
</div>
