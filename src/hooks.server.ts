import type { Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';
import { building } from '$app/environment';
import { addTomlToDb } from '$lib/server/db/questions';
import questionsToml from '../questions.toml?raw'


const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);

	if (session) {
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
	} else {
		auth.deleteSessionTokenCookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;
	return resolve(event);
};

export const handle: Handle = handleAuth;

if (!building) {
	console.log("Adding questions from TOML to DB")
	await addTomlToDb(questionsToml)
}
