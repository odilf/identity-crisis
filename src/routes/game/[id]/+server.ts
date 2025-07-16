import { produce, type Connection } from 'sveltekit-sse';
import type { RequestHandler } from './$types';
import { unwrap } from '$lib/utils';
import { stringify } from 'devalue';
import type { Event } from './event';
import { requireLoginInsideLoad } from '$lib/server/auth';

const subscribers: Map<string, Map<string, Connection['emit']>> = new Map();

export function _emit<T extends Event>(gameId: string, data: T) {
	subscribers.get(gameId)?.forEach((emit) => {
		const { error } = emit('update', stringify(data));
		if (error) {
			console.warn({ msg: 'Error when emitting message', gameId, error, data });
		}
	});
}

export const POST: RequestHandler = async ({ params }) => {
	const user = requireLoginInsideLoad();
	return produce(async function start({ emit }) {
		if (!subscribers.has(params.id)) {
			subscribers.set(params.id, new Map());
		}
		const emitFns = unwrap(subscribers.get(params.id));
		emitFns.set(user.id, emit);
		console.log(`${emitFns.size} subscribers for ${params.id}`);

		return () => {
			subscribers.get(params.id)?.delete(user.id);
		};
	});
};
