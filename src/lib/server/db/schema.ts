import { relations, sql } from 'drizzle-orm';

import { sqliteTable, integer, text, real, primaryKey, foreignKey } from 'drizzle-orm/sqlite-core';

import { createId } from '@paralleldrive/cuid2';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const userRelations = relations(user, ({ many }) => ({ players: many(gamePlayers) }));

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const question = sqliteTable('question', {
	id: integer('id').primaryKey(),
	question: text('question').notNull(),
	answerA: text('answer_a').notNull(),
	answerB: text('answer_b').notNull(),

	// Extra parameters
	hotness: real('hotness'),
	knowledge: text('knowledge'),
	losesAllPointsOption: text('loses_all_points_option'),
	beheadingOption: text('beheading_option'),
	plus1PointOption: text('plus1_point_option'),
	invincibilityOption: text('invincibility_option'),
	jailOption: text('jail_option'),
	genocideRouteOption: text('genocide_route_option'),
	followUpQuestionId: text('follow_up_question_id'),
	followUpConditionOption: text('follow_up_condition_option'),
	invicibilityOrBeheadingOption: text('invincibility_or_beheading_option')
});

export const questionRelations = relations(question, ({ one }) => ({
	followUpQuestion: one(question, {
		fields: [question.followUpQuestionId],
		references: [question.id]
	})
}));

export const game = sqliteTable('game', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	creation_date: integer('creation_date', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`(current_timestamp)`),
	hotness: real('hotness').notNull().default(2),
	hostId: text('host_id')
		.references(() => user.id)
		.notNull(),
	turn: integer('turn').default(sql`null`),
	activeQuestionId: integer('active_question_id')
		.default(sql`null`)
		.references(() => question.id)
});

export const gameRelations = relations(game, ({ one, many }) => ({
	players: many(gamePlayers),
	host: one(user, {
		fields: [game.hostId],
		references: [user.id]
	}),
	activeQuestion: one(question, {
		fields: [game.activeQuestionId],
		references: [question.id]
	}),
	answers: many(answer)
}));

export const gamePlayers = sqliteTable(
	'game_players',
	{
		gameId: text('game_id')
			.notNull()
			.references(() => game.id),
		playerId: text('player_id')
			.notNull()
			.references(() => user.id),
		index: integer('index').notNull(),
		points: real('points').notNull().default(0.0)
	},
	(table) => [primaryKey({ columns: [table.gameId, table.playerId] })]
);

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
	game: one(game, {
		fields: [gamePlayers.gameId],
		references: [game.id]
	}),
	player: one(user, {
		fields: [gamePlayers.playerId],
		references: [user.id]
	})
}));

export const answer = sqliteTable(
	'answer',
	{
		id: text('id').$defaultFn(() => createId()),
		index: integer('index').notNull(),
		gameId: text('game_id')
			.references(() => game.id)
			.notNull(),
		playerId: text('player_id')
			.references(() => user.id)
			.notNull(),
		value: real('value').notNull(),
		timestamp: integer('timestamp', { mode: 'timestamp_ms' })
			.notNull()
			.default(sql`(current_timestamp)`)
	},
	(table) => [primaryKey({ columns: [table.gameId, table.playerId, table.index] })]
);

export const answerRelations = relations(answer, ({ one }) => ({
	game: one(game, {
		fields: [answer.gameId],
		references: [game.id]
	}),
	player: one(user, {
		fields: [answer.playerId],
		references: [user.id]
	})
}));

export const rating = sqliteTable('rating', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	question_id: text('question_id')
		.references(() => question.id)
		.notNull(),
	rating: real('rating').notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Question = typeof question.$inferSelect;
