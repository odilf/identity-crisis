export function calcSimilarity(monarch: { value: number }, other: { value: number }): number {
	return (1 - Math.abs(monarch.value - other.value)) ** 1.5;
}
export function calcSimilarities(
	monarchAnswer: { value: number },
	otherAnswers: { value: number }[]
) {
	const similarities = otherAnswers.map((other) => calcSimilarity(monarchAnswer, other));
	const averageAnswer = otherAnswers.reduce((a, b) => a + b.value, 0) / otherAnswers.length;
	return {
		overall: similarities.reduce((a, b) => a + b, 0) / similarities.length,
		similarities,
		averageAnswer
	};
}
