<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/atkinson-hyperlegible-next';

	let { children } = $props();
</script>

<div class="flex flex-col h-full">
	<div class="grid grid-cols-3 w-screen bg-tertiary text-base h-8 content-center">
		<div> </div>
		<a href="/" class="content-center text-center font-light"> who am i </a>
		<div class="justify-self-end">
			<a href="/profile" class="hover:bg-base/10 transition flex py-1 px-3 rounded-l-2xl">
				Profile <img src="/user-icon.svg" alt="User">
			</a>
		</div>
	</div>
	<div class="flex-1">
		{@render children()}
	</div>
</div>
