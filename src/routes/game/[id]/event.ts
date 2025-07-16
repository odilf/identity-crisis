import * as z from 'zod/mini';

export const eventSchema = z.union([
	z.object({
		event: z.literal('playerConnected'),
		playerId: z.string()
	}),
	z.object({
		event: z.literal('playerLeave'),
		playerId: z.string()
	}),
	z.object({
		event: z.literal('start')
	}),
	z.object({
		event: z.literal('allSubmitted'),
		lastPlayerId: z.string()
	}),
	z.object({
		event: z.literal('continue')
	}),
	z.object({
		event: z.literal('finish')
	}),
]);

export type Event = z.infer<typeof eventSchema>;
