import sqlite3 from "sqlite3";

import type { PlayerStat } from "./types.js";
import { execute } from "../lib/Sqlite3.js";

export function initGraphql() {
  const dbFilename = "fantasy-db.db";

  const db = new sqlite3.Database(dbFilename);

  return {
    Query: {
      playerStats: async (): Promise<PlayerStat[]> => {
        const sqlResponse = await execute(
          db,
          `
          select 
          s.name as statName,
          p.name as fullName,
          value as statValue
          from player_stats s
          inner join players p
          on s.key == p.key
          `
        ).catch((error) => {
          console.error(error);
        });

        const playerStats = sqlResponse.map((sqlItem) => {
          const { statName, fullName, statValue } = sqlItem;

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
