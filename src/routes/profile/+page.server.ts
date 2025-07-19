import { eq, and, desc } from 'drizzle-orm'
import { requireLoginInsideLoad } from "$lib/server/auth"
import { db, schema } from "$lib/server/db";
import type { Actions, PageServerLoad } from "./$types"

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
  
}
