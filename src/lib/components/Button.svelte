<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Props = (
		| ({ href: string } & HTMLAnchorAttributes)
		| ({ href?: undefined } & HTMLButtonAttributes)
	) & { children?: Snippet; class?: ClassValue; buttonType?: 'danger' };

	let props: Props = $props();

	if (props.href === undefined) {
		props;
	}

	const style =
		'hover:bg-glow-base/20 transition flex gap-2 rounded px-[1em] py-[0.3em] cursor-pointer neon neon-md box-neon color-base';
</script>

{#if props.href !== undefined}
	<a
		{...props}
		href={props.href}
		class={cn(style, props.class, props.buttonType === 'danger' && 'neon-red hover:bg-red-300')}
	>
		{@render props.children?.()}
	</a>
{:else}
	<button {...props} class={cn(style, props.class, props.buttonType === 'danger' && 'neon-red')}>
		{@render props.children?.()}
	</button>
{/if}
