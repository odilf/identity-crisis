<script lang="ts">
	import Slider from '$lib/components/Slider.svelte';
	import { calcSimilarities } from '$lib/similarity';
	import { format, unwrap } from '$lib/utils';
	import { areAllAnswered, getActiveAnswers, getMonarch } from './game';
	import { enhance } from '$app/forms';
	import type { Answer, Game, Question, User } from '$lib/server/db/schema';
	import Button from '$lib/components/Button.svelte';
	import { crossfade, fade, fly, scale, blur } from 'svelte/transition';
	import { expoInOut, expoOut } from 'svelte/easing';

	let {
		game,
		answer,
		user
	}: {
		game: Game & { turn: number } & { players: { player: User }[] } & {
			answers: (Answer & { player: { username: string } })[];
		} & {
			activeQuestion: Question;
		};
		answer: Answer | null;
		user: User;
	} = $props();

	let monarch = $derived(getMonarch(game).player);
	let allAnswered = $derived(areAllAnswered(game));
	let isMonarch = $derived(monarch.id === user.id);

	// From https://stackoverflow.com/questions/73002812/regex-accurately-match-bold-and-italics-items-from-the-input
	function mdToHtml(md: string) {
		return md.replace(/\*\*(.+?)\*\*(?!\*)/g, '<b>$1</b>').replace(/\*([^*><]+)\*/g, '<i>$1</i>');
	}

	let submitButton: HTMLButtonElement | null = $state(null);
	let unsubmitButton: HTMLButtonElement | null = $state(null);

	const [send, receive] = crossfade({
		duration: 1_000,
		easing: expoInOut,
		fallback: (node) => fly(node, { duration: 400, y: 10 })
	});
</script>

<h1 class="mb-8 flex justify-between gap-4 text-3xl font-light">
	Monarch {game.finished ? 'was' : 'is'}
	{isMonarch ? 'you' : monarch.username}
	<p class="faint mb-4 text-lg font-light">Question {game.turn}</p>
</h1>
<h2
	class="neon box-neon neon-sm mb-2 w-full rounded-full px-6 py-4 text-center text-2xl font-bold text-balance"
>
	{game.activeQuestion.question}
</h2>

{#if allAnswered}
	<div class="relative" transition:blur>
		<div class="faint absolute mr-auto mb-4 flex w-full text-left text-sm text-balance">
			<span class="flex-1 text-left">{@html mdToHtml(game.activeQuestion.answerA)}</span>
			<span> — </span>
			<span class="flex-1 text-right">{@html mdToHtml(game.activeQuestion.answerB)}</span>
		</div>
	</div>
{/if}

<section class={['relative flex h-full flex-col justify-center']}>
	<form
		class="absolute inset-0 flex h-full flex-col justify-center"
		method="post"
		action="?/submit"
		use:enhance={() => {
			return async ({ update }) => {
				await update({ invalidateAll: false, reset: false });
			};
		}}
	>
		{#if !allAnswered}
			<div class="mr-auto w-[70%] text-left text-lg text-balance" transition:fly={{ x: -50 }}>
				{@html mdToHtml(game.activeQuestion.answerA)}
			</div>
			<div
				out:send={{ key: isMonarch ? 'monarch' : 'pleb' }}
				in:receive={{ key: isMonarch ? 'monarch' : 'pleb' }}
			>
				<Slider
					value={answer?.value ?? 0.5}
					locked={allAnswered || game.finished}
					onpress={() => unsubmitButton?.click()}
					onrelease={() => submitButton?.click()}
					name="value"
				/>
			</div>
			<div class="ml-auto w-[70%] text-right text-lg text-balance" transition:fly={{ x: 50 }}>
				{@html mdToHtml(game.activeQuestion.answerB)}
			</div>
			<button class="hidden" formaction="?/unsubmit" bind:this={unsubmitButton}>unsumbut</button>
			<button class="hidden" formaction="?/submit" bind:this={submitButton}>unsumbut</button>
		{/if}
	</form>

	{#if allAnswered}
		{@const activeAnswers = getActiveAnswers(game)}
		{@const { overall, averageAnswer } = calcSimilarities(
			unwrap(activeAnswers.monarch),
			activeAnswers.rest
		)}
		<h2
			class="neon neon-sm mb-8 text-center text-2xl"
			in:scale|global={{ duration: 3000, start: 0.5, delay: 600, easing: expoOut }}
			out:scale={{ duration: 500, start: 0.9 }}
		>
			Overall similarity score: <br /> <span class="text-8xl font-bold">{format(overall)}</span>
		</h2>

		<h3 class="text-xl font-bold" in:fade|global={{ duration: 400, delay: 1000 }} out:fade>
			Monarch's ({monarch.username}) answer
		</h3>
		<div in:receive|global={{ key: 'monarch' }} out:send={{ key: 'monarch' }}>
			<Slider value={unwrap(activeAnswers.monarch).value} locked={true} name="monarch-value" />
		</div>
		<h3 class="text-xl font-bold" in:fade|global={{ duration: 400, delay: 1000 }} out:fade>
			Other answers
		</h3>
		<div in:receive|global={{ key: 'pleb' }} out:send={{ key: 'pleb' }}>
			<Slider
				value={averageAnswer}
				locked={true}
				name="average-answer-value"
				marks={activeAnswers.rest.length > 1
					? activeAnswers.rest.map(({ value, player }) => ({
							value,
							label: player.username
						}))
					: []}
			/>
		</div>
	{/if}
</section>

{#if !game.finished}
	<div class="mt-8 flex w-full gap-2">
		<form use:enhance action="?/leave" method="post" class="flex-1">
			<Button buttonType="danger" class="w-full py-4">
				<span class="w-full text-center"> End game </span>
			</Button>
		</form>

		{#if allAnswered}
			<form class="h-full w-full flex-2 text-center" method="post" action="?/continue" use:enhance>
				<Button class="w-full rounded py-4"
					><span class="w-full text-center"> Continue </span></Button
				>
			</form>
		{/if}
	</div>
{/if}
