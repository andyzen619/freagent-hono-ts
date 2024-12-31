import { execute, range } from "../lib/Utils/index.js";
import { type Player, type StatCategory } from "../lib/YfbApi/types.js";

import type { SeederInitParams } from "./types.js";

export default function ({ db, execute, logger }: SeederInitParams) {
  type RangeFunction = typeof range;

  return {
    seed: async function ({ playersToSeed }: { playersToSeed: Player[] }) {
      logger.info("Seeding 'players' database ...");

      try {
        await createTables({ db });

        await playersToSeed.reduce(async (accPromise: any, curr: Player) => {
          const player = curr;

          let seededPlayer;

          const acc = await accPromise;

          await execute(
            db,
            `INSERT INTO players (player_key, player_id, player_name, primary_position, status, team) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              player.player_key,
              player.player_id,
              player.name.full,
              player.primary_position,
              player.status,
              player.editorial_team_full_name,
            ]
          ).catch((error) => {
            logger.error(error);
          });

          return [...acc, seededPlayer];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}

async function createTables({ db }: { db: SeederInitParams["db"] }) {
  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS players (
      player_key TEXT PRIMARY KEY,
      player_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      primary_position TEXT NOT NULL,
      status TEXT,
      team TEXT NOT NULL
    );`
  ).catch((error) => {
    throw new Error(error);
  });
}
