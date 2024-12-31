import { serve } from "@hono/node-server";
import { app } from "@getcronit/pylon";
import fs from "fs";
import sqlite3 from "sqlite3";
import { pino } from "pino";

import YfbApiInit from "./lib/YfbApi/index.js";

import PlayersSeed from "./seeders/Player.js";
import PlayerStatsSeed from "./seeders/PlayerStat.js";

import { execute, range, getUri } from "./lib/Utils.js";
import login from "./routes/login.js";
import callback from "./routes/callback.js";
import type { Player, YfbApi } from "./lib/YfbApi/types.js";

import {
  GetPlayersOptionsStatusEnum,
  GetPlayersOptionsSortEnum,
  GetPlayersOptionsSortTypeEnum,
} from "./lib/YfbApi/types.js";

const CLIENT_ID =
  "dj0yJmk9NWFQVWJadWZ4a3dNJmQ9WVdrOWRYTlFUbk5FWmswbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVl";

const CLIENT_SECRET = "add36b85715f4023f932adf55de4af46d1fd9716";

const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";

const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

app.get("/", (c) => {
  return c.text("Hello Fantasy!");
});

app.get("/login", login({ CLIENT_ID, AUTH_URL, getUri }));

app.get(
  "/callback",
  callback({
    CLIENT_ID,
    CLIENT_SECRET,
    TOKEN_URL,
    getUri,
    logger,
  })
);

const port = 3000;

logger.info(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export const graphql = {
  Query: {
    helloWorld: (): string => {
      return "HELLO WORLD!";
    },
  },
};

const dbFilename = "fantasy-db";

fs.rm(dbFilename, () => {
  logger.info("Previous database wiped.");

  import("../authenticationToken.json")
    .then(async (module) => {
      const { authenticationToken } = module as any;

      const db = new sqlite3.Database(dbFilename);

      const yfbApi = YfbApiInit({
        authenticationToken,
      });

      const statCategories = await yfbApi.getStatCategories();

      const totalPlayers = 3;

      const batchSize = 3;

      const numberOfJobs = Math.floor(totalPlayers / batchSize);

      let jobs = range(1, numberOfJobs);

      const { playersToSeed } = await getPlayersFromYfbApi({
        jobs,
        batchSize,
        yfbApi,
      });

      try {
        await PlayersSeed({
          db,
          execute,
          logger,
        }).seed({
          playersToSeed,
        });

        await PlayerStatsSeed({
          db,
          execute,
          logger,
        }).seed({
          playersToSeed,
          statCategories,
        });

        // await logSeeded({ db, logger });
      } finally {
        db.close();
      }
    })
    .catch((e) => logger.error(e));
});

async function getPlayersFromYfbApi({
  jobs,
  batchSize,
  yfbApi,
}: {
  jobs: number[];
  batchSize: number;
  yfbApi: YfbApi;
}) {
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

  return { playersToSeed: playersFromApi };
}

async function logSeeded({ db, logger }: any) {
  db.each(
    `select player_name, stat_name, stat_id, value from players INNER JOIN player_stats ON player_stats.player_key = players.player_key`,
    (error: any, stat: any) => {
      if (error) {
        logger.error(error);
      } else {
        logger.info({ name: "PLAYER_STAT", stat });
      }
    }
  );

  db.get(
    `SELECT COUNT(*) as row_count FROM player_stats`,
    (error: any, row: any) => {
      if (error) {
        logger.error(error);
      } else {
        logger.info(row.row_count);
      }
    }
  );
}
