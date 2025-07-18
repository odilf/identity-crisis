<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import { blur } from 'svelte/transition';
</script>

<div class="neon grid h-full content-center">
	<div>
		<h1
			class="box-neon neon neon-em-xl mx-auto w-fit rounded-2xl px-16 py-6 text-center text-[10vw] font-thin"
			in:blur
		>
			who am i
		</h1>
		<div class="appear-down mt-16 flex justify-center gap-14 text-3xl">
			<form use:enhance action="/game?/createGame" method="post">
				<Button class="neon box-neon">Host</Button>
			</form>
			<Button href="game/">Join</Button>
		</div>
	</div>
</div>

<style>
	:root {
		--exp: cubic-bezier(0, 0, 0, 1);
		--sine: cubic-bezier(0.445, 0.05, 0.55, 0.95);
		/* animation: 6s ease-out glow-in forwards; */
	}

	h1 {
		animation:
			1s var(--sine) -1s infinite alternate bob-x,
			1.12s var(--sine) -0.2s infinite alternate bob-small-x,
			1.72s var(--sine) -0.5s infinite alternate bob-small-y,
			3s var(--exp) forwards appear-up;
		opacity: 0;
		animation-composition: add;
		outline: 1px solid;
		outline-color: color-mix(in oklab, var(--color-primary) 00%, transparent);
	}

	.appear-down {
		animation: 2s var(--exp) 0s forwards appear-down;
	}

	@keyframes appear-up {
		from {
			opacity: 0%;
			transform: translateY(-50%);
		}
		50% {
			outline-color: color-mix(in oklab, var(--color-primary) 0%, transparent);
		}
		to {
			outline-color: var(--color-primary);
			opacity: 100%;
			transform: translateY(0%);
		}
	}

	@keyframes appear-down {
		from {
			opacity: 0%;
			transform: translateY(20%);
		}
		50% {
			opacity: 0%;
			transform: translateY(20%);
		}
		to {
			opacity: 100%;
			transform: translateY(0%);
		}
	}

	@keyframes bob-x {
		from {
			transform: translateX(0.1%);
		}
		to {
			transform: translateX(-0.1%);
		}
	}
	@keyframes bob-small-x {
		from {
			transform: translateX(0.3%);
		}
		to {
			transform: translateX(-0.5%);
		}
	}
	@keyframes bob-small-y {
		from {
			transform: translateY(0.1%);
		}
		to {
			transform: translateY(-0.2%);
		}
	}

	@keyframes glow-in {
		from {
			--glow-opacity: 0%;
		}
		to {
			--glow-opacity: 100%;
		}
	}
</style>
