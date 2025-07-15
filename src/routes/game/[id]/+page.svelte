<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import NewGame from './NewGame.svelte';
	import Slider from '$lib/components/Slider.svelte';
	import { calcSimilarities, calcSimilarity } from '$lib/similarity';
	import { format, unwrap } from '$lib/utils';
	import * as z from 'zod/mini';
	import * as devalue from 'devalue';
	import { source } from 'sveltekit-sse';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { eventSchema } from './event';
	import { areAllAnswered, getActiveAnswers, getMonarch } from './game';

	let { data }: PageProps = $props();
	let formElem: HTMLFormElement | null = $state(null);
	let unsubmitButton: HTMLButtonElement | null = $state(null);
	let value = $state(data.answer?.value ?? 0.5);
	let ready = $state(false);

	const unsubscribe = source(`/game/${data.game.id}`)
		.select('update')
		.subscribe(async (value) => {
			// I'm not sure why this happens...
			if (value === '') {
				return;
			}

			const event = z.parse(eventSchema, devalue.parse(value));
			if ('playerId' in event && event.playerId === data.user.id) {
				console.log('Skipping self event: ', event);
				return;
			}

			console.log('Received event: ', event);
			if (browser) {
				await invalidateAll();
			}
		});

	onDestroy(() => unsubscribe());
</script>

<main class="mx-auto flex h-full max-w-screen min-w-sm flex-col px-4 py-8">
	{#if data.game.activeQuestion === null}
		<NewGame {...data} />
	{:else if data.game.turn === null}
		Invalid db state, activeQuestion isn't null but turn is.
	{:else}
		{@const monarch = getMonarch(data.game).player}
		{@const allAnswered = areAllAnswered(data.game)}

		<h1 class="mb-8 flex justify-between gap-4 text-3xl font-light">
			Monarch is {monarch.id === data.user.id ? 'you' : monarch.username}
			<p class="faint mb-4 text-lg font-light">Question {data.game.turn}</p>
		</h1>
		<h2 class="bg-primary mb-4 w-full py-4 text-center text-2xl text-base font-bold">
			{data.game.activeQuestion.question}
		</h2>

		<form
			class="flex h-full flex-col"
			method="post"
			action="?/submit"
			bind:this={formElem}
			use:enhance={() => {
				return async ({ update }) => {
					await update({ invalidateAll: false, reset: false });
				};
			}}
		>
			<div class="mr-auto w-[70%] text-left">{data.game.activeQuestion.answerA}</div>
			<Slider
				value={data.answer?.value ?? 0.5}
				locked={allAnswered}
				onpress={() => unsubmitButton?.click()}
				onrelease={() => formElem?.submit()}
			/>
			<div class="ml-auto w-[70%] text-right">{data.game.activeQuestion.answerB}</div>
			<button class="hidden" formaction="?/unsubmit" bind:this={unsubmitButton}>unsumbut</button>

			<div class="flex-1"></div>
		</form>

		{#if allAnswered}
			{@const activeAnswers = getActiveAnswers(data.game)}
			{@const { overall } = calcSimilarities(unwrap(activeAnswers.monarch), activeAnswers.rest)}
			<h2 class="text-2xl text-center">Overall similarity score: <span class="font-bold text-5xl">{format(overall)}</span></h2>
			<h3>Monarch's ({data.game.players.find((player) => player.playerId === unwrap(activeAnswers.monarch).playerId)?.player.username}) answer</h3>
			<div>
				<Slider value={unwrap(activeAnswers.monarch).value} locked={true} />
			</div>
			<h3 class="font-bold text-xl">Other answers</h3>
			<ul>
				{#each activeAnswers.rest as answer}
					<li>
						<div>
							{data.game.players.find((player) => player.playerId === answer.playerId)?.player
							.username}'s answer
							({format(calcSimilarity(answer, unwrap(activeAnswers.monarch)))} match)
						</div>
						<Slider value={answer.value} locked={true} />
					</li>
				{/each}
			</ul>
			<form class="w-full" method="post" action="?/continue">
				<button class="bg-primary w-full rounded px-[1em] py-[0.3em] text-base"> Continue </button>
			</form>
		{/if}
	{/if}
</main>
