<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main class="mx-auto flex h-full max-w-screen min-w-sm flex-col px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-4 text-3xl">Host a game</h1>
		<form use:enhance action="?/createGame" method="post">
			<Button>Host</Button>
		</form>
	</div>

	<h1 class="mb-4 text-3xl">Or join an existing game</h1>
	<ul>
		{#each data.openGames as openGame}
			<li class="bg-primary w-fit rounded p-2 text-base">
				<a href="/game/{openGame.id}">
					<div class="font-bold">{openGame.host.username}'s</div>
					<div class="faint text-sm">ID: {openGame.id}'s</div>
					<div>
						Players:
						<ol class="list-decimal">
							{#each openGame.players as { player }}
								<li>{player.username}</li>
							{/each}
						</ol>
					</div>
				</a>
			</li>
		{:else}
			<p class="faint">Nothing to show for now...</p>
		{/each}
	</ul>
</main>
