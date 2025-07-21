import { eq, desc } from 'drizzle-orm'
import { requireLoginInsideLoad } from "$lib/server/auth"
import { db, schema } from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types"
import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ }) => {
  const user = requireLoginInsideLoad();
  const games = db.query.game.findMany({
    with: {
      players: {
        where: (table, { eq }) => eq(table.playerId, user.id),
        with: {
          player: true
        }
      },
      answers: true,
      host: true,
    },
    orderBy: desc(schema.game.creation_date)
  })

  return {
    user,
    games,
  }
}

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/login');
	}
}
