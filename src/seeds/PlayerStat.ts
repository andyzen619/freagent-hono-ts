import { sql } from "kysely";

import type { SeederInitParams } from "./types.js";
import type { YfbPlayer, YfbStatCategory } from "../lib/YfbApi/types.js";
import database from "../database/index.js";
import type { PlayerStatsTable } from "../database/types.js";

export default function PlayerStats({ logger }: SeederInitParams) {
  return {
    seed: async function ({
      dataToSeed,
      statCategories,
    }: {
      dataToSeed: YfbPlayer[];
      statCategories: YfbStatCategory[];
    }) {
      logger.info("Seeding 'player_stats' database ...");

      try {
        await database.schema
          .createTable("player_stats")
          .ifNotExists()
          .addColumn("key", "text", (col) => col.notNull())
          .addColumn("id", "text", (col) => col.notNull())
          .addColumn("name", "text", (col) =>
            col
              .notNull()
              .check(
                sql`name IN ('FGM/A', '3PTM', 'PTS', 'REB', 'AST', 'ST', 'BLK', 'TO', 'FG%', 'FTM/A', 'FT%')`
              )
          )
          .addColumn("value", "text", (col) => col.notNull())
          .execute();

        await dataToSeed.reduce(async (accPromise: any, player: YfbPlayer) => {
          const acc = await accPromise;

          const statsToSeed = player.player_stats.stats.stat.map(
            ({ stat_id, value }) =>
              setNameOnStat({
                stat_id,
                value,
                player_key: player.player_key,
                statCategories,
              })
          );

          const promises = statsToSeed.map(async (playerStat) =>
            database
              .insertInto("player_stats")
              .values({
                id: playerStat.stat_id,
                key: playerStat.player_key,
                name: playerStat.name,
                value: playerStat.value,
              })
              .returningAll()
              .executeTakeFirst()
          );

          const seededStatsForPlayer = await Promise.all(promises);

          return [...acc, { key: player.player_key, seededStatsForPlayer }];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}

export function setNameOnStat({ statCategories, stat_id, player_key, value }): {
  player_key: string;
  stat_id: string;
  name: PlayerStatsTable["name"];
  value: string;
} {
  const statCategory = statCategories.find(
    ({ stat_id: statIdToMatch }: { stat_id: number }) =>
      stat_id === statIdToMatch
  );

  return {
    player_key,
    stat_id,
    name: statCategory ? statCategory.display_name : "UNKNOWN",
    value,
  };
}
