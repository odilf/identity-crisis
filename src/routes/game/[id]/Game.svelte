<script lang="ts">
	import Slider from '$lib/components/Slider.svelte';
	import { calcSimilarities, calcSimilarity } from '$lib/similarity';
	import { format, unwrap } from '$lib/utils';
	import { areAllAnswered, getActiveAnswers, getMonarch } from './game';
	import { enhance } from '$app/forms';
	import type { Answer, Game, Question, User } from '$lib/server/db/schema';
	import Button from '$lib/components/Button.svelte';

	let {
		game,
		answer,
		user
	}: {
		game: Game & { players: { player: User }[] } & { answers: Answer[] } & {
			activeQuestion: Question;
		};
		answer: Answer | null;
		user: User;
	} = $props();

	let monarch = $derived(getMonarch(game).player);
	let allAnswered = $derived(areAllAnswered(game));

	// From https://stackoverflow.com/questions/73002812/regex-accurately-match-bold-and-italics-items-from-the-input
	function mdToHtml(md: string) {
		return md.replace(/\*\*(.+?)\*\*(?!\*)/g, '<b>$1</b>').replace(/\*([^*><]+)\*/g, '<i>$1</i>');
	}

	let submitButton: HTMLButtonElement | null = $state(null);
	let unsubmitButton: HTMLButtonElement | null = $state(null);
</script>

<h1 class="mb-8 flex justify-between gap-4 text-3xl font-light">
	Monarch {game.finished ? 'was' : 'is'}
	{monarch.id === user.id ? 'you' : monarch.username}
	<p class="faint mb-4 text-lg font-light">Question {game.turn}</p>
</h1>
<h2
	class="neon box-neon neon-sm mb-4 w-full rounded-full px-6 py-4 text-center text-2xl font-bold text-balance"
>
	{game.activeQuestion.question}
</h2>

<form
	class="flex h-full flex-col"
	method="post"
	action="?/submit"
	use:enhance={() => {
		return async ({ update }) => {
			await update({ invalidateAll: false, reset: false });
		};
	}}
>
	<div class="mr-auto w-[70%] text-left text-balance">
		{@html mdToHtml(game.activeQuestion.answerA)}
	</div>
	<Slider
		value={answer?.value ?? 0.5}
		locked={allAnswered || game.finished}
		onpress={() => unsubmitButton?.click()}
		onrelease={() => submitButton?.click()}
		name="value"
	/>
	<div class="ml-auto w-[70%] text-right text-balance">
		{@html mdToHtml(game.activeQuestion.answerB)}
	</div>
	<button class="hidden" formaction="?/unsubmit" bind:this={unsubmitButton}>unsumbut</button>
	<button class="hidden" formaction="?/submit" bind:this={submitButton}>unsumbut</button>

	<div class="flex-1"></div>
</form>

{#if allAnswered}
	{@const activeAnswers = getActiveAnswers(game)}
	{@const { overall } = calcSimilarities(unwrap(activeAnswers.monarch), activeAnswers.rest)}
	<h2 class="neon neon-sm text-center text-2xl">
		Overall similarity score: <br /> <span class="text-8xl font-bold">{format(overall)}</span>
	</h2>
	<h3>
		Monarch's ({monarch.username}) answer
	</h3>
	<div>
		<Slider value={unwrap(activeAnswers.monarch).value} locked={true} name="monarch-value" />
	</div>
	<h3 class="text-xl font-bold">Other answers</h3>
	<ul>
		{#each activeAnswers.rest as answer}
			<li>
				<div>
					{game.players.find((player) => player.player.id === answer.playerId)?.player.username}'s
					answer ({format(calcSimilarity(answer, unwrap(activeAnswers.monarch)))}
					match)
				</div>
				<Slider value={answer.value} locked={true} name="{answer.playerId}-value" />
			</li>
		{/each}
	</ul>
{/if}

{#if !game.finished}
	<div class="flex w-full gap-2">
		<form use:enhance action="?/leave" method="post" class="flex-1">
			<Button style="danger" class="w-full py-4">
				<span class="w-full text-center"> End game </span>
			</Button>
		</form>

		{#if allAnswered}
			<form class="h-full w-full flex-2 py-4 text-center" method="post" action="?/continue">
				<Button class="w-full rounded"><span class="w-full text-center"> Continue </span></Button>
			</form>
		{/if}
	</div>
{/if}
