import { serve } from "@hono/node-server";
import { app } from "@getcronit/pylon";
import Database from "better-sqlite3";

import YfbApiInit from "./lib/YfbApi/index.js";
import PlayersSeed from "./seeds/Player.js";
import PlayerStatsSeed from "./seeds/PlayerStat.js";

import { range } from "./lib/Utils/index.js";
import { auth } from "./routers/auth/index.js";

import { initGraphql } from "./graphql/index.js";
import { initLogger } from "./lib/Logger.js";
import { prepareSeedData } from "./seeds/index.js";
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

import("../authenticationToken.json")
  .then(async (module) => {
    const { authenticationToken } = module as any;

    await initDatabase({ authenticationToken });
  })
  .catch((e) => logger.error(e));

export const graphql = initGraphql();

const initDatabase = async ({ authenticationToken }) => {
  const db = new Database(CONSTANT_DATABASE_FILENAME);

  await db.exec("DROP TABLE IF EXISTS players;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      key TEXT PRIMARY KEY,
      id INTEGER NOT NULL,
      name TEXT NOT NULL,
      primaryPosition TEXT NOT NULL,
      status TEXT,
      team TEXT NOT NULL
    );
  `);

  await db.exec("DROP TABLE IF EXISTS player_stats;");

  await db.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
      key TEXT NOT NULL,
      id INTEGER NOT NULL,
      name TEXT,
      value TEXT NOT NULL,
      PRIMARY KEY (key, id), -- Composite key to avoid duplicate stats for a player
      FOREIGN KEY (key) REFERENCES players(key) ON DELETE CASCADE
    );
  `);

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
      logger,
    }).seed({
      dataToSeed,
    });

    await PlayerStatsSeed({
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
