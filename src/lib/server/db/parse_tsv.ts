import { deepStrictEqual } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { db, schema } from '.';
import { eq } from 'drizzle-orm';

async function parse_generic_tsv(tsv: string, f: (row: string[]) => unknown) {
	let index_end = 0;
	for (let index = 0; index < tsv.length; index = index_end + 1) {
		index_end = tsv.indexOf('\r\n', index);
		if (index_end == -1) {
			index_end = tsv.length;
		}

		const row = tsv.substring(index + 1, index_end - 1).split('\t');
		await f(row);
	}
}

export async function parse_tsv(tsv: string) {
	const headerEnd = tsv.indexOf('\r\n');
	const header = tsv.slice(0, headerEnd);
	const body = tsv.slice(headerEnd + 1);

	deepStrictEqual(
		[
			'Id',
			'Question',
			'Answer A',
			'Answer B',
			'Hotness',
			'Knowledge',
			'Loses all points',
			'Beheading (game over)',
			'+1 point',
			'Invicibility',
			'Jail',
			'if monarch chooses said option, everyone else loses all their points (genocide route)',
			'Follow Up Question',
			'Condition for follow up',
			'50/50 chance you get invicibility or beheaded'
		],
		header.split('\t')
	);

	await parse_generic_tsv(body, async (row) => {
		const [
			id,
			question,
			answerA,
			answerB,
			hotness,
			knowledge,
			losesAllPointsOption,
			beheadingOption,
			plus1PointOption,
			invincibilityOption,
			jailOption,
			genocideRouteOption,
			followUpQuestionId,
			followUpConditionOption,
			invicibilityOrBeheadingOption
		] = [...row, ...Array(15).fill(null)].map((item) => (item === '' ? null : item));

		if (id === null || question === null || answerA === null || answerB === null) {
			console.warn({ msg: 'Skipping entry', id, question, answerA, answerB });
			return;
		}

		const options = [
			losesAllPointsOption,
			beheadingOption,
			plus1PointOption,
			invincibilityOption,
			jailOption,
			genocideRouteOption,
			followUpConditionOption,
			invicibilityOrBeheadingOption
		];

		if (
			options.some(
				(option) => !(option === null || option === 'A' || option === 'B' || option === 'A,B')
			)
		) {
			console.warn({ msg: 'Some option in question is malformed', id, question });
			console.log(options);
			return;
		}

		await db.delete(schema.question).where(eq(schema.question.id, parseInt(id)));
		await db.insert(schema.question).values({
			id: parseInt(id),
			question,
			answerA,
			answerB,
			hotness: parseFloat(hotness ?? '0'),
			knowledge,
			losesAllPointsOption,
			beheadingOption,
			plus1PointOption,
			invincibilityOption,
			jailOption,
			genocideRouteOption,
			followUpQuestionId,
			followUpConditionOption,
			invicibilityOrBeheadingOption
		});
	});
}

// TODO: This should be at some other file.
export const invincibilityTexts = [
	'Your delusion protects you from reality',
	'Your delusion grants you strenght, sure, but at what cost?',
	'Reality is no more. The shape in the mirror pretending to be flesh and bones is not yours. You have become untouchable, beyond hunger and thirst.'
];

const file = await readFile('./who-am-i.tsv');
await parse_tsv(file.toString());
console.log('Done!');
