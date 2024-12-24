import sqlite3 from "sqlite3";

import { execute, range } from "../lib/Utils/index.js";
import {
  type YfbApi,
  type Player,
  GetPlayersOptionsStatusEnum,
  GetPlayersOptionsSortEnum,
  GetPlayersOptionsSortTypeEnum,
} from "../lib/YfbApi/index.js";
import pino from "pino";

type PlayersSeedParams = {
  db: sqlite3.Database;
  yfbApi: YfbApi;
  execute: typeof execute;
  range: typeof range;
  logger: pino.Logger;
  totalPlayers?: number;
  batchSize?: number;
};

export default {
  seed: async function ({
    db,
    yfbApi,
    execute,
    range,
    logger,
    totalPlayers = 5,
    batchSize = 5,
  }: PlayersSeedParams) {
    logger.info("Seeding 'players' database ...");

    try {
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

      const statCategories = await yfbApi.getStatCategories();

      const numberOfJobs = Math.floor(totalPlayers / batchSize);

      let jobs = range(1, numberOfJobs);

      const players = await jobs.reduce<Promise<Player[]>>(
        async (accPromise, _, jobNumber) => {
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

      await players.reduce(async (accPromise: any, curr: Player) => {
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
              ({ stat_id: statIdToMatch }) => stat_id === statIdToMatch
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
        (err, row: any) => {
          if (err) {
            logger.error(err);
          } else {
            logger.info(row.row_count);
          }
        }
      );
    } catch (error) {
      logger.error("Error during seeding:", error);
    } finally {
      db.close();
    }
  },
};
