import { requireLoginInsideLoad } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({}) => {
	const user = requireLoginInsideLoad();

	// Redirect if already in game
	const gameResult = (
		await db
			.select()
			.from(schema.game)
			.innerJoin(schema.gamePlayers, eq(schema.game.id, schema.gamePlayers.gameId))
			.where(and(eq(schema.gamePlayers.playerId, user.id), eq(schema.game.finished, false)))
			.limit(1)
	)[0];
	if (gameResult !== undefined) {
		throw redirect(302, `/game/${gameResult.game.id}`);
	}

	const openGames = await db.query.game.findMany({
		where: (table, { isNull }) => isNull(table.activeQuestionId),
		with: {
			players: {
				with: { player: true }
			},
			host: true
		}
	});

	return {
		openGames
	};
};

export const actions: Actions = {
	createGame: async ({}) => {
		const user = requireLoginInsideLoad();

		// TODO: Check also for games where the user is a regular player, not the host.
		const existingGame = await db.query.game.findFirst({
			where: (game, { eq, and }) => and(eq(game.hostId, user.id), eq(game.finished, false))
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
