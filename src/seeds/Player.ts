import type { YfbPlayer } from "../lib/YfbApi/types.js";
import database from "../database/index.js";

import type { SeederInitParams } from "./types.js";
import { sql } from "kysely";

export default function ({ logger }: SeederInitParams) {
  return {
    seed: async function ({ dataToSeed }: { dataToSeed: YfbPlayer[] }) {
      logger.info("Seeding 'players' database ...");

      try {
        await database.schema
          .createTable("players")
          .ifNotExists()
          .addColumn("key", "text", (col) => col.notNull().primaryKey()) // Assuming 'key' is the unique identifier
          .addColumn("id", "integer", (col) => col.notNull().unique()) // Assuming 'id' is unique
          .addColumn("name", "text", (col) => col.notNull())
          .addColumn("primaryPosition", "text", (col) =>
            col
              .notNull()
              .check(
                sql`primaryPosition IN ('PG', 'SG', 'G', 'SF', 'F', 'PF', 'C')`
              )
          )
          .addColumn("status", "text")
          .addColumn("team", "text", (col) => col.notNull())
          .execute();

        await dataToSeed.reduce(async (accPromise: any, player: YfbPlayer) => {
          const acc = await accPromise;

          const seedPlayer = await database
            .insertInto("players")
            .values({
              id: player.player_id,
              key: player.player_key,
              name: player.name.full,
              primaryPosition: player.primary_position,
              status: player.status,
              team: player.editorial_team_full_name,
            })
            .returningAll()
            .executeTakeFirst();

          return [...acc, seedPlayer];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}
