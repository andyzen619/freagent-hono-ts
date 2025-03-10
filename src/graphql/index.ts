import type { PlayerStat } from "./types.js";
import database from "../database/index.js";

export function initGraphql() {
  return {
    Query: {
      playerStats: async (): Promise<PlayerStat[]> => {
        const dbResponse = await database
          .selectFrom("player_stats")
          .innerJoin("players", "players.key", "player_stats.key")
          .select([
            "players.name as fullName",
            "player_stats.name as statName",
            "player_stats.value as statValue",
          ])
          .execute();

        const playerStats = dbResponse.map((dbItem) => {
          const { fullName, statName, statValue } = dbItem;

          return {
            fullName,
            statName,
            statValue,
          };
        });

        return playerStats;
      },
    },
  };
}
