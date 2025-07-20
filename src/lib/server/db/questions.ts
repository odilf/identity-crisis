import { deepStrictEqual } from 'node:assert';
import { db, schema } from '.';
import { eq } from 'drizzle-orm';
import { questionSchema, type Question } from './schema';
import * as smol_toml from 'smol-toml';
import * as z from 'zod';

function error(t: object): never {
	throw t;
}

async function parseGenericTsv(tsv: string, f: (row: string[]) => unknown) {
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

function parseTsvRow(row: string[]): Question {
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
		error({ msg: 'Skipping entry', id, question, answerA, answerB });
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
		error({ msg: 'Some option in question is malformed', id, question });
	}

	return {
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
	};
}

export async function parseTsv(tsv: string, f: (question: Question) => unknown) {
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

	await parseGenericTsv(body, async (row) => {
		let data: Question;
		try {
			await f(parseTsvRow(row));
		} catch (err) {
			console.warn('Error while parsing tsv row: ', err);
			return;
		}
	});
}

export async function addTsvToDb(tsv: string) {
	await parseTsv(tsv, async (question) => {
		await db.delete(schema.question).where(eq(schema.question.id, question.id));
		await db.insert(schema.question).values(question);
	});
}

export async function addTomlToDb(toml: string) {
	// NOTE: A bit of a bodge to fix the fact that `createSelectSchema` from drizzle
	// doesn't actually make field optional, just nullable...
	const nullableQuestionSchema = z.preprocess((question) => {
		return typeof question === 'object'
			? {
					hotness: null,
					knowledge: null,
					losesAllPointsOption: null,
					beheadingOption: null,
					plus1PointOption: null,
					invincibilityOption: null,
					jailOption: null,
					genocideRouteOption: null,
					followUpQuestionId: null,
					followUpConditionOption: null,
					invicibilityOrBeheadingOption: null,
					...question
				}
			: question;
	}, questionSchema);

	const objSchema = z.object({ questions: z.array(nullableQuestionSchema) });
	const data = objSchema.parse(smol_toml.parse(toml));

	await db.transaction(async (tx) => {
		for (const question of data.questions) {
			await tx.delete(schema.question).where(eq(schema.question.id, question.id));
			await tx.insert(schema.question).values(question);
		}
	});
}

export async function tsvToToml(tsv: string) {
	const questions: Question[] = [];
	await parseTsv(tsv, (question) => questions.push(question));
	return smol_toml.stringify({ questions });
}

// TODO: This should be at some other file.
export const invincibilityTexts = [
	'Your delusion protects you from reality',
	'Your delusion grants you strenght, sure, but at what cost?',
	'Reality is no more. The shape in the mirror pretending to be flesh and bones is not yours. You have become untouchable, beyond hunger and thirst.'
];
