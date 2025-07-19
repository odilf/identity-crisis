<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<main class="main">
	<h1 class="mb-8 text-3xl font-bold">Login/Register</h1>
	<form method="post" action="?/login" use:enhance>
		<div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-right">
			<label for="username" class="pl-4"> Username </label>
			<input name="username" class="bg-base color-primary outline-base2 mr-8 rounded" />
			<label for="password" class="pl-4"> Password </label>
			<input
				type="password"
				name="password"
				class="bg-base color-primary outline-base2 mr-8 rounded"
			/>
		</div>
		<div class="mx-auto mt-8 w-[min(380px,100%)]">
			<div class="flex gap-4">
				<button
					class="hover:bg-primary/10 text-secondary outline-secondary w-full rounded bg-none px-5 py-2 outline-1 transition"
				>
					Login
				</button>
				<button
					class="hover:bg-primary/10 text-secondary outline-secondary w-full rounded bg-none px-5 py-2 outline-1 transition"
					formaction="?/register"
				>
					Register
				</button>
			</div>
			<p class="mt-2 w-full text-center text-red-400">{form?.message ?? ''}</p>
		</div>
	</form>
</main>
