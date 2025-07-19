<script lang="ts">
	import type { PageProps } from './$types';
	import NewGame from './NewGame.svelte';
	import Game from './Game.svelte';

	import * as z from 'zod/mini';
	import * as devalue from 'devalue';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { eventSchema } from './event';
	import { unwrap } from '$lib/utils';

	let { data }: PageProps = $props();

	onMount(() => {
		fetch(`/game/${data.game.id}`, { method: 'post' })
			.then(async (response) => {
				if (response.body === null) {
					return;
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();

				while (true) {
					const { done, value } = await reader.read();

					const string = decoder.decode(value);
					const object = devalue.parse(string);
					const result = z.safeParse(eventSchema, object);

					if (!result.success) {
						console.warn(result.error);
					}

					const event = unwrap(result.data);

					// Ignore self-events
					if ('playerId' in event && event.playerId === data.user.id) {
						return;
					}

					if (event)
						// TODO: Update using data from event instead of invalidating all always.
						await invalidateAll();

					if (done) {
						return;
					}
				}
			})
			.catch((err) => console.warn('Error while fetching promise', err));
	});

	$inspect(data.game);
</script>

<main class="main flex flex-col">
	{#if data.game.activeQuestion === null}
		<NewGame {...data} />
	{:else if data.game.turn === null}
		Invalid state (active question isn't null but game turn is)
	{:else}
		<Game
			game={{ ...data.game, activeQuestion: data.game.activeQuestion, turn: data.game.turn }}
			answer={data.answer}
			user={data.user}
		/>
	{/if}
</main>
