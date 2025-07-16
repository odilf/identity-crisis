import { requireLoginInsideLoad } from '$lib/server/auth';
import { db, schema } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { and, eq } from 'drizzle-orm';
import { unwrap } from '$lib/utils';
import { emit } from './+server';

export const load: PageServerLoad = async ({ params }) => {
	const user = requireLoginInsideLoad();
	let game = await db.query.game.findFirst({
		where: (game, { eq }) => eq(game.id, params.id),
		with: {
			players: {
				with: {
					player: true
				},
				columns: {
					index: true,
					points: true
				},
				orderBy: (players, { asc }) => asc(players.index)
			},
			host: true,
			activeQuestion: true,
			answers: true
		}
	});

	if (game === undefined) {
		// Game doesn't exist
		throw redirect(302, '/game');
	}

	const inGame = game.players.some(({ player }) => player.id === user.id);
	if (game.activeQuestion !== null && !inGame) {
		// Started game that isn't the user's
		throw redirect(302, '/game');
	}

	// Join game, if it exists
	if (game.hostId !== user.id && !inGame) {
		await db.insert(schema.gamePlayers).values({
			gameId: game.id,
			playerId: user.id,
			index: game.players.length
		});
		emit(params.id, { event: 'playerConnected', playerId: user.id });
		game.players.push({ player: user, index: game.players.length, points: 0 });
	}

	// Get answer, if it exists
	let answer = null;
	if (game.activeQuestion !== null) {
		answer = await db.query.answer.findFirst({
			where: (table, { eq, and }) =>
				and(
					eq(table.gameId, params.id),
					eq(table.playerId, user.id),
					eq(table.index, unwrap(game.turn))
				)
		});
	}

	return {
		game,
		user,
		answer
	};
};

async function selectQuestion(
	turn: number,
	gameId: string,
	db_or_tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0] = db
) {
	const questions = await db_or_tx.query.question.findMany();

	// TODO: Make more sofisticated choosing method.
	const selected = questions[Math.floor(Math.random() * questions.length)];
	await db_or_tx
		.update(schema.game)
		.set({
			turn,
			activeQuestionId: selected.id
		})
		.where(and(eq(schema.game.id, gameId), eq(schema.game.finished, false)));
}

export const actions: Actions = {
	start: async ({ params }) => {
		const game = await db.query.game.findFirst({
			where: (game, { eq, and }) => and(eq(game.id, params.id), eq(game.finished, false)),
			with: {
				players: true
			}
		});

		if (game && game.players.length <= 1) {
			return;
		}

		await selectQuestion(0, params.id);
		emit(params.id, { event: 'start' });
	},

	leave: async ({ params }) => {
		const user = requireLoginInsideLoad();
		const game = await db.query.game.findFirst({
			where: (game, { eq, and }) => and(eq(game.id, params.id), eq(game.finished, false)),
			with: {
				players: true
			}
		});

		if (game === undefined) {
			return;
		}

		if (game.activeQuestionId !== null) {
			await db.update(schema.game).set({ finished: true });
			emit(params.id, { event: 'finish' });
		} else if (game.players.length <= 1) {
			await db.delete(schema.game).where(eq(schema.game.id, params.id));
			emit(params.id, { event: 'playerLeave', playerId: user.id });
			throw redirect(302, '/game');
		} else {
			await db.delete(schema.gamePlayers).where(eq(schema.gamePlayers.playerId, user.id));
			emit(params.id, { event: 'playerLeave', playerId: user.id });
			throw redirect(302, '/game');
		}
	},

	submit: async ({ params, request }) => {
		const user = requireLoginInsideLoad();
		const [game, data] = await Promise.all([
			db.query.game.findFirst({
				where: (game, { eq, and }) => and(eq(game.id, params.id), eq(game.finished, false)),
				with: {
					answers: true,
					players: true
				}
			}),
			request.formData()
		]);

		if (game === undefined || game.turn === null) {
			throw new Error("unreachable (game or game's turn is null)");
		}

		const value = parseFloat(data.get('value')?.toString() ?? '');
		if (isNaN(value)) {
			throw new Error("Slider value was NaN!");
		}

		await db.transaction(async (tx) => {
			await tx
				.insert(schema.answer)
				.values({
					gameId: game.id,
					playerId: user.id,
					value,
					index: unwrap(game.turn, "Game turn was undefined in insert answer?")
				})
				.onConflictDoNothing();

			await tx
				.update(schema.answer)
				.set({
					value
				})
				.where(
					and(
						eq(schema.answer.gameId, game.id),
						eq(schema.answer.playerId, user.id),
						eq(schema.answer.index, unwrap(game.turn))
					)
				);

			if (
				game.answers.filter(({ index }) => index === game.turn).length + 1 >=
				game.players.length
			) {
				emit(params.id, { event: 'allSubmitted', lastPlayerId: user.id });
			}
		});
	},

	unsubmit: async ({ params }) => {
		const user = requireLoginInsideLoad();
		db.transaction(async (tx) => {
			const game = unwrap(
				await tx.query.game.findFirst({
					where: (game, { eq, and }) => and(eq(game.id, params.id), eq(game.finished, false)),
					with: {
						players: true,
						answers: true
					}
				})
			);

			// Dissallow unselecting if everybody has selected
			if (game.answers.filter(({ index }) => index === game.turn).length >= game.players.length) {
				return;
			}

			await tx
				.delete(schema.answer)
				.where(
					and(
						eq(schema.answer.playerId, user.id),
						eq(schema.answer.gameId, params.id),
						eq(schema.answer.index, unwrap(game.turn))
					)
				);
		});
	},

	continue: async ({ params }) => {
		const game = unwrap(
			await db.query.game.findFirst({
				where: (game, { eq, and }) => and(eq(game.id, params.id), eq(game.finished, false)),
				with: {
					answers: true,
					players: true
				}
			})
		);

		if (game.answers.filter(({ index }) => index === game.turn).length < game.players.length) {
			throw new Error('Not every player has answered');
		}

		await selectQuestion(unwrap(game.turn) + 1, params.id);
		emit(params.id, { event: 'continue' });
	}
};
