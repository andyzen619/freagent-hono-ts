import sqlite3 from "sqlite3";

import { execute, range } from "../lib/utils.js";
import type { YfbApi, Player } from "../lib/YfbApi/index.js";
import pino from "pino";
import { log } from "console";

type PlayersSeedParams = {
  db: sqlite3.Database;
  yfbApi: YfbApi;
  execute: typeof execute;
  range: typeof range;
  logger: pino.Logger;
};

export default async function ({
  db,
  yfbApi,
  execute,
  range,
  logger,
}: PlayersSeedParams) {
  logger.info("Seeding 'players' database ...");

  try {
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS players (
        player_key TEXT PRIMARY KEY,
        player_id INTEGER NOT NULL,
        name TEXT NOT NULL, -- Full name
        primary_position TEXT NOT NULL,
        status TEXT,
        team TEXT NOT NULL -- Editorial team name or abbreviation
      );`
    ).catch((error) => {
      throw new Error(error);
    });

    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS player_stats (
        player_key TEXT NOT NULL,
        stat_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (player_key, stat_id), -- Composite key to avoid duplicate stats for a player
        FOREIGN KEY (player_key) REFERENCES players(player_key)
      );`
    ).catch((error) => {
      throw new Error(error);
    });

    let jobs = range(1, 5);

    const players = await jobs.reduce<Promise<Player[]>>(
      async (accPromise, _, jobNumber) => {
        const acc = await accPromise;

        const count = 5;

        try {
          const { players } = await yfbApi.getPlayers({
            count: `${count}`,
            start: `${jobNumber * count}`,
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
        `INSERT INTO players (player_key, player_id, name, primary_position, status, team) VALUES (?, ?, ?, ?, ?, ?)`,
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

      const insertPlayerStatsTablePromises = player.player_stats.stats.stat.map(
        async ({ stat_id, value }) => {
          await execute(
            db,
            `INSERT INTO player_stats (player_key, stat_id, value) VALUES (?, ?, ?)`,
            [player.player_key, stat_id, value]
          ).catch((error) => {
            logger.error(error);
          });
        }
      );

      await Promise.all(insertPlayerStatsTablePromises);

      return [...acc, seededPlayer];
    }, []);

    db.each(
      `select name, stat_id, value from players INNER JOIN player_stats ON player_stats.player_key = players.player_key`,
      (error, stat) => {
        if (error) {
          logger.error(error);
        } else {
          logger.info({ name: "PLAYER_STAT", stat });
        }
      }
    );
  } catch (error) {
    logger.error("Error during seeding:", error);
  } finally {
    db.close();
  }
}
