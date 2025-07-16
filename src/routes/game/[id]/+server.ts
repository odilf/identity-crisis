import type { RequestHandler } from './$types';
import { stringify } from 'devalue';
import type { Event } from './event';
import { requireLoginInsideLoad } from '$lib/server/auth';

const subscribers: Map<
	string,
	Map<string, ReadableStreamDefaultController<string>['enqueue']>
> = new Map();

export function _emit<T extends Event>(gameId: string, data: T) {
	console.log('emmiting event', { data });
	subscribers.get(gameId)?.forEach((enque) => {
		enque(stringify(data));
	});
}

export const POST: RequestHandler = async ({ params }) => {
	const user = requireLoginInsideLoad();
	const stream = new ReadableStream({
		start: (controller) => {
			let enqueFns = subscribers.get(params.id);
			if (enqueFns === undefined) {
				enqueFns = new Map();
				subscribers.set(params.id, enqueFns);
			}

			enqueFns.set(user.id, (data: string) => controller.enqueue(data));
		},
		cancel: () => {
			let enqueFns = subscribers.get(params.id);
			enqueFns?.delete(user.id);
		}
	});

	return new Response(stream, {
		headers: {
			// Denotes the response as SSE
			'Content-Type': 'text/event-stream',
			// Optional. Request the GET request not to be cached.
			'Cache-Control': 'no-cache'
		}
	});
};
