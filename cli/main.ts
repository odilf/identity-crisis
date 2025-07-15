import { isCancel } from '@clack/prompts';
import { cancel } from '@clack/prompts';
import { intro, select, text } from '@clack/prompts';
import { readFile, writeFile } from 'node:fs/promises';
import * as questions from '../src/lib/server/db/questions';
import { outro } from '@clack/prompts';

intro('Development CLi');

const command = await select({
	message: 'Select a command',
	options: [
		{ value: 'tomlToDb', label: 'Parse TOML file and add it to database' },
		{ value: 'tsvToDb', label: 'Parse TSV file and add it to database' },
		{ value: 'tsvToToml', label: 'Parse TSV file and output a TOML file' }
	]
});

if (isCancel(command)) {
	cancel('Operation cancelled');
	process.exit(0);
}

const defaultToml = './questions.toml';
const defaultTsv = './questions.tsv';
const def = command === 'tomlToDb' ? defaultToml : defaultTsv;

const path = await text({
	message: 'Enter file path',
	defaultValue: def,
	placeholder: def
});

if (isCancel(path)) {
	cancel('Operation cancelled');
	process.exit(0);
}

const fileContents = (await readFile(path)).toString();

if (command === 'tomlToDb') {
	await questions.addTomlToDb(fileContents);
} else if (command === 'tsvToDb') {
	await questions.addTsvToDb(fileContents);
} else if (command === 'tsvToToml') {
	const outputPath = await text({
		message: 'Enter TOML output path',
		defaultValue: defaultToml,
		placeholder: defaultToml
	});

	if (isCancel(outputPath)) {
		cancel('Operation cancelled');
		process.exit(0);
	}

	const toml = await questions.tsvToToml(fileContents);
	await writeFile(outputPath, toml);
}

outro('Done!');
