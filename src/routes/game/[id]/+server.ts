import { produce, type Connection } from 'sveltekit-sse';
import type { RequestHandler } from './$types';
import type { sqliteTableCreator } from 'drizzle-orm/sqlite-core';
import { unwrap } from '$lib/utils';
import { stringify } from 'devalue';
import type { Event } from './event';

const subscribers: Map<string, Set<Connection['emit']>> = new Map();

export function emit<T extends Event>(gameId: string, data: T) {
	subscribers.get(gameId)?.forEach((emit) => emit('update', stringify(data)));
}

export const POST: RequestHandler = async ({ params, request }) => {
	let emitOuter: Connection['emit'] | null = null;
	return produce(
		async function start({ emit }) {
			emitOuter = emit;
			if (!subscribers.has(params.id)) {
				subscribers.set(params.id, new Set());
			}
			const subs = unwrap(subscribers.get(params.id));
			subs.add(emit);
			console.log(`${subs.size} subscribers for ${params.id}`)
		},
		{
			stop: () => {
				if (emitOuter !== null) {
					subscribers.get(params.id)?.delete(emitOuter);
				}
			}
		}
	);
};
