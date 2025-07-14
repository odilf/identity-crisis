import { requireLoginInsideLoad } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	createGame: async ({}) => {
		const user = requireLoginInsideLoad();

		// TODO: Check also for games where the user is a regular player, not the host.
		const existingGame = await db.query.game.findFirst({
			where: (game, { eq }) => eq(game.hostId, user.id)
		});

		if (existingGame !== undefined) {
			throw redirect(302, `/game/${existingGame.id}`);
		}

		let game = await db.transaction(async (tx) => {
			const result = await tx
				.insert(schema.game)
				.values({
					hostId: user.id
				})
				.returning({ id: schema.game.id });
			const game = result[0];

			await tx.insert(schema.gamePlayers).values({
				gameId: game.id,
				playerId: user.id,
				index: 0
			});

			return game;
		});

		throw redirect(302, `/game/${game.id}`);
	}
};
