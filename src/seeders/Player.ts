import { execute, range } from "../lib/Utils/index.js";
import {
  type Player,
  GetPlayersOptionsStatusEnum,
  GetPlayersOptionsSortEnum,
  GetPlayersOptionsSortTypeEnum,
} from "../lib/YfbApi/types.js";

import type { SeederInitParams } from "./types.js";

export default function ({ db, yfbApi, execute, logger }: SeederInitParams) {
  type RangeFunction = typeof range;

  return {
    seed: async function ({
      range,
      totalPlayers = 5,
      batchSize = 5,
    }: {
      range: RangeFunction;
      totalPlayers?: number;
      batchSize?: number;
    }) {
      logger.info("Seeding 'players' database ...");

      try {
        await createTables({ db });

        const statCategories = await yfbApi.getStatCategories();

        const numberOfJobs = Math.floor(totalPlayers / batchSize);

        let jobs = range(1, numberOfJobs);

        const playersFromApi = await jobs.reduce<Promise<Player[]>>(
          async (accPromise: Promise<any>, _: any, jobNumber: number) => {
            const acc = await accPromise;

            const count = batchSize;

            const start = jobNumber * count;

            try {
              const { players } = await yfbApi.getPlayers({
                count: `${count}`,
                start: `${start}`,
                status: GetPlayersOptionsStatusEnum.A,
                sort: GetPlayersOptionsSortEnum.AR,
                sort_type: GetPlayersOptionsSortTypeEnum.lastweek,
              });

              return [...acc, ...players];
            } catch (error) {
              logger.error(error);

              return acc;
            }
          },
          Promise.resolve([])
        );

        await playersFromApi.reduce(async (accPromise: any, curr: Player) => {
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

          // await logSeeded({ db, logger }); // Used to sanity check seed results.

          return [...acc, seededPlayer];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      } finally {
        db.close();
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

async function logSeeded({
  db,
  logger,
}: {
  db: SeederInitParams["db"];
  logger: SeederInitParams["logger"];
}) {
  db.each(
    `select player_name, stat_name, stat_id, value from players INNER JOIN player_stats ON player_stats.player_key = players.player_key`,
    (error, stat) => {
      if (error) {
        logger.error(error);
      } else {
        logger.info({ name: "PLAYER_STAT", stat });
      }
    }
  );

  db.get(
    `SELECT COUNT(*) as row_count FROM player_stats`,
    (error, row: any) => {
      if (error) {
        logger.error(error);
      } else {
        logger.info(row.row_count);
      }
    }
  );
}
