<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';

	let { data }: PageProps = $props();
	let { user, games } = $derived(data);
</script>

<main class="main">
	<h1 class="mb-8 text-3xl font-bold">Hello, {user.username}</h1>
	<form method="post" action="?/logout" use:enhance class="mb-8">
		<Button buttonType="danger">Sign out</Button>
	</form>

	{#await games then games}
		<h2 class="mb-4 text-xl font-bold">Past games</h2>
		<ol class="flex flex-col gap-4">
			{#each games as game}
				<li
					class={[
						game.finished
							? 'bg-glow-base/20 outline-glow-base/50'
							: 'bg-glow-secondary-base/20 outline-glow-secondary-base/50',
						'rounded p-4 outline'
					]}
				>
					<a href="/game/{game.id}">
						<div>Hosted by {game.host.username}</div>
						<div>On {game.creation_date.toDateString()}</div>
						<div>Players: {game.players.map(({ player }) => player.username)}</div>
					</a>
				</li>
			{/each}
		</ol>
	{/await}
</main>
