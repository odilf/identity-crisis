<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/atkinson-hyperlegible-next';

	let { children } = $props();
</script>

<div class="flex h-full flex-col">
	<div class="bg-tertiary grid h-8 w-screen grid-cols-3 content-center text-base">
		<div></div>
		<a href="/" class="content-center text-center font-light"> who am i </a>
		<div class="justify-self-end">
			<a href="/profile" class="hover:bg-base/10 flex rounded-l-2xl px-3 py-1 transition">
				Profile <img src="/user-icon.svg" alt="User" />
			</a>
		</div>
	</div>
	<div class="flex-1">{@render children()}</div>
</div>
