import { serve } from "@hono/node-server";
import { app } from "@getcronit/pylon";
import fs from "fs";
import sqlite3 from "sqlite3";

import YfbApiInit from "./lib/YfbApi/index.js";
import PlayersSeed from "./databaseSeeds/Player.js";
import PlayerStatsSeed from "./databaseSeeds/PlayerStat.js";

import { range } from "./lib/Utils.js";
import { execute } from "./lib/Sqlite3.js";
import { auth } from "./routers/auth/index.js";

import { initGraphql } from "./graphql/index.js";
import { initLogger } from "./lib/Logger.js";
import { prepareSeedData } from "./databaseSeeds/index.js";
import { CONSTANT_DATABASE_FILENAME } from "./database/constants.js";

export const logger = initLogger();

app.get("/", (c) => {
  return c.text("Hello Fantasy!");
});

app.route("/auth", auth);

const port = 3000;

logger.info(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export let db;

fs.rm(CONSTANT_DATABASE_FILENAME, () => {
  logger.info("Previous database wiped.");

  import("../authenticationToken.json")
    .then(async (module) => {
      const { authenticationToken } = module as any;

      await initDatabase({ authenticationToken });
    })
    .catch((e) => logger.error(e));
});

export const graphql = initGraphql();

const initDatabase = async ({ authenticationToken }) => {
  db = new sqlite3.Database(CONSTANT_DATABASE_FILENAME);

  const yfbApi = YfbApiInit({
    authenticationToken,
  });

  const statCategories = await yfbApi.getStatCategories();

  const totalPlayers = 3;

  const batchSize = 3;

  const numberOfJobs = Math.floor(totalPlayers / batchSize);

  let jobs = range(1, numberOfJobs);

  const { dataToSeed } = await prepareSeedData({
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
      dataToSeed,
    });

    await PlayerStatsSeed({
      db,
      execute,
      logger,
    }).seed({
      dataToSeed,
      statCategories,
    });

    //  Additional tables go here...
  } finally {
    db.close();
  }
};
