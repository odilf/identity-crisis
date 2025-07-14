<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/Button.svelte';
</script>

<div class="grid h-full content-center">
	<div>
		<h1 class="text-center text-8xl font-thin">who am i</h1>
		<div class="mt-8 flex justify-center gap-14 text-3xl">
			<form use:enhance action="/game?/createGame" method="post">
				<Button>Host</Button>
			</form>
			<Button href="game/">Join</Button>
		</div>
	</div>
</div>
