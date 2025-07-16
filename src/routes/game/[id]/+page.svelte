<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import NewGame from './NewGame.svelte';
	import Game from './Game.svelte';

	import * as z from 'zod/mini';
	import * as devalue from 'devalue';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { eventSchema } from './event';

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
					const { success, data: event, error } = z.safeParse(eventSchema, object);

					if (!success) {
						console.warn(error);
					}

					console.log({ event });
					await invalidateAll();

					if (done) {
						return;
					}
				}
			})
			.catch((err) => console.warn('Error while fetching promise', err));
	});
</script>

<main class="mx-auto flex h-full max-w-xl min-w-sm flex-col px-4 py-8">
	{#if data.game.activeQuestion !== null}
		<Game
			game={{ ...data.game, activeQuestion: data.game.activeQuestion }}
			answer={data.answer}
			user={data.user}
		/>
	{:else}
		<NewGame {...data} />
	{/if}
</main>
