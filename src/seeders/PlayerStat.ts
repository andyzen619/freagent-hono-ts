import type { SeederInitParams } from "./types.js";
import type { Player, StatCategory } from "../lib/YfbApi/types.js";

export default function PlayerStats({ db, execute, logger }: SeederInitParams) {
  return {
    seed: async function ({
      playersToSeed,
      statCategories,
    }: {
      playersToSeed: Player[];
      statCategories: StatCategory[];
    }) {
      logger.info("Seeding 'player_stats' database ...");

      try {
        await createTables({ db, execute });

        await playersToSeed.reduce(async (accPromise: any, curr: Player) => {
          const player = curr;

          let seededPlayer;

          const acc = await accPromise;

          const statsToSeed = player.player_stats.stats.stat.map(
            ({ stat_id, value }) => {
              const statCategory = statCategories.find(
                ({ stat_id: statIdToMatch }: { stat_id: number }) =>
                  stat_id === statIdToMatch
              );

              return {
                player_key: player.player_key,
                stat_id,
                name: statCategory ? statCategory.display_name : "UNKNOWN",
                value,
              };
            }
          );

          const statsToSeedPromises = statsToSeed.map(async (playerStat) => {
            await execute(
              db,
              `INSERT INTO player_stats (player_key, stat_id, stat_name, value) VALUES (?,?,?,?)`,
              [
                playerStat.player_key,
                playerStat.stat_id,
                playerStat.name,
                playerStat.value,
              ]
            ).catch((error) => {
              logger.error(error);
            });

            return {};
          });

          await Promise.all(statsToSeedPromises);

          return [...acc, seededPlayer];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}

async function createTables({
  db,
  execute,
}: {
  db: SeederInitParams["db"];
  execute: SeederInitParams["execute"];
}) {
  await execute(
    db,
    `CREATE TABLE IF NOT EXISTS player_stats (
      player_key TEXT NOT NULL,
      stat_id INTEGER NOT NULL,
      stat_name TEXT,
      value TEXT NOT NULL,
      PRIMARY KEY (player_key, stat_id), -- Composite key to avoid duplicate stats for a player
      FOREIGN KEY (player_key) REFERENCES players(player_key)
    );`
  ).catch((error) => {
    throw new Error(error);
  });
}
