export function getMonarch<P>(game: { players: P[]; turn: number }) {
	return game.players[game.turn % game.players.length];
}

export function getAllActiveAnswers<A extends { index: number }>(game: {
	answers: A[];
	turn: number | null;
}) {
	return game.answers.filter(({ index }) => index === game.turn);
}

export function getActiveAnswers<
	A extends { index: number; playerId: string },
	P extends { player: { id: string } }
>(game: { answers: A[]; players: P[]; turn: number }) {
	const allActiveAnswers = getAllActiveAnswers(game);
	const monarch = getMonarch(game);
	return {
		monarch: allActiveAnswers.find((answer) => answer.playerId === monarch.player.id),
		rest: allActiveAnswers.filter((answer) => answer.playerId !== monarch.player.id)
	};
}

export function areAllAnswered<
	A extends { index: number; playerId: string },
	P extends { player: { id: string } }
>(game: { answers: A[]; players: P[]; turn: number }) {
	const activeAnswers = getActiveAnswers(game);
	return activeAnswers.rest.length + (activeAnswers.monarch ? 1 : 0) >= game.players.length;
}
