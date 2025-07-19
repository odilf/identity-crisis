<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import { blur, fly, scale } from 'svelte/transition';

	// TODO: Type variables
	let { game, user } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">New game</h1>

<div class="grid sm:grid-cols-2">
	<div>
		<p>Hosted by {game.host.username}</p>
		<p class="faint mb-1">id: {game.id}</p>
		<Button onclick={async () => await navigator.clipboard.writeText(page.url.toString())}>
			<div class="pr-2">Copy link</div>
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
				class="py-[1px]"
				><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
					d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
				/></svg
			>
		</Button>

		<p class="faint mt-2 mb-4">{page.url.toString()}</p>
	</div>

	<div>
		<div class="text-2xl font-bold">Connected players</div>
		<ol>
			{#each game.players as player}
				<li class="ml-5 list-decimal" transition:fly={{ x: -20 }}>{player.player.username}</li>
			{/each}
		</ol>
	</div>
</div>

<div class="flex-1"></div>

<div class="flex w-full gap-2">
	<form use:enhance action="?/leave" method="post" class="flex-1">
		<Button class="w-full py-4" style="danger">
			<span class="w-full text-center">
				{game.hostId === user.id ? 'Cancel game' : 'Leave game'}
			</span>
		</Button>
	</form>

	{#if game.hostId === user.id && game.players.length > 1}
		<form class="flex-3" use:enhance action="?/start" method="post" in:scale={{ start: 0.8 }}>
			<Button class="w-full py-4">
				<span class="w-full text-center"> Start game </span>
			</Button>
		</form>
	{/if}
</div>
