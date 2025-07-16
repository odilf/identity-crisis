<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, href, ...restProps }: { children: Snippet; href?: string } & Record<string, any> =
		$props();
</script>

{#if typeof href == 'string'}
	<a {href} class="bg-primary rounded px-[1em] py-[0.3em] text-base" {...restProps}>
		{@render children()}
	</a>
{:else}
	<button
		class="bg-primary hover:bg-secondary flex gap-2 rounded px-[1em] py-[0.3em] text-base"
		{...restProps}
	>
		{@render children()}
	</button>
{/if}
