<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';

	// TODO: Type variables
	let { game, user } = $props();
</script>

<h1 class="mb-4 text-3xl font-bold">New game</h1>

<div class="grid grid-cols-2">
	<div>
		<p>Hosted by {game.host.username}</p>
		<p class="faint mb-1">id: {game.id}</p>
		<Button onclick={() => navigator.clipboard.writeText(page.url.toString())}>
			<div>Copy link</div>
			<img src="/copy-link.svg" alt="copy link" />
		</Button>
	</div>

	<div>
		<div class="text-2xl font-bold">Connected players</div>
		<ol>
			{#each game.players as player}
				<li class="list-decimal">{player.player.username}</li>
			{:else}
				<p class="faint">No one is connected yet!</p>
			{/each}
		</ol>
	</div>
</div>

<div class="flex-1"></div>

{#if game.hostId === user.id}
	<form use:enhance action="?/start" method="post">
		<Button
			class="bg-primary hover:bg-secondary mt-4 flex w-full cursor-pointer gap-2 rounded px-[1em] py-4 text-base transition"
		>
			<span class="w-full text-center"> Start game </span>
		</Button>
	</form>
{/if}
