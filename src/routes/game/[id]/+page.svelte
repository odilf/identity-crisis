<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import NewGame from './NewGame.svelte';
	import Slider from '$lib/components/Slider.svelte'
	import { calcSimilarities, calcSimilarity } from '$lib/similarity'
	import { format, unwrap } from '$lib/utils';

	let { data }: PageProps = $props();
	let formElem: HTMLFormElement | null = $state(null);
	let unsubmitButton: HTMLButtonElement | null = $state(null);
	let value = $state(data.answer?.value ?? 0.5);
	let ready = $state(false);
</script>

<main class="mx-auto flex h-full max-w-screen min-w-sm flex-col px-4 py-8">
	{#if data.game.activeQuestion === null}
		<NewGame {...data} />
	{:else if data.game.turn === null}
		Invalid db state, activeQuestion isn't null but turn is.
	{:else}
		{@const monarch = data.game.players[data.game.turn % data.game.players.length].player}
		{@const handleRelease = () => {
			ready = true;
			formElem?.submit();
			console.log(formElem, "caca")
		}}
		{@const handlePress = () => {
			ready = false;
			unsubmitButton?.click();
			console.log(formElem, "caca")
		}}
		{@const allAnswered = data.activeAnswers.rest.length + (data.activeAnswers.monarch ? 1 : 0) >= data.game.players.length}

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
					await update({ invalidateAll: true, reset: false });
				};
			}}
		>
			<div class="mr-auto w-[70%] text-left">{data.game.activeQuestion.answerA}</div>
			<Slider value={data.answer?.value ?? 0.5} disabled={allAnswered} onpress={handlePress} onrelease={handleRelease}/>
			<div class="ml-auto w-[70%] text-right">{data.game.activeQuestion.answerB}</div>
			<button class="hidden" formaction="?/unsubmit" bind:this={unsubmitButton}>unsumbut</button>

			<div class="flex-1"></div>
		</form>

		{#if allAnswered}
			{@const { overall } = calcSimilarities(unwrap(data.activeAnswers.monarch), data.activeAnswers.rest)}
			<h2> Overall similarity score: {format(overall)} </h2>
			<h3> Other answers </h3>
			<ul>
				{#each data.activeAnswers.rest as answer}
					<li>
						{data.game.players.find(player => player.playerId === answer.playerId)?.player.username}
						<Slider value={answer.value} disabled={true}/>
						{format(calcSimilarity(answer, unwrap(data.activeAnswers.monarch)))}
					</li>
				{/each}
			</ul>
			<form class="w-full" method="post" action="?/continue">
				<button class="bg-primary w-full rounded px-[1em] py-[0.3em] text-base">
					Continue
				</button>
			</form>
		{/if}
	{/if}
</main>
