export function calcSimilarity(monarch: { value: number }, other: { value: number }): number {
  return 1 - Math.abs(monarch.value - other.value)
}
export function calcSimilarities(
  monarchAnswer: { value: number },
  otherAnswers: { value: number }[]
) {
  const similarities = otherAnswers.map(other => calcSimilarity(monarchAnswer, other))
  return {
    overall: similarities.reduce((a, b) => a + b, 0) / similarities.length,
    similarities
  }
}
