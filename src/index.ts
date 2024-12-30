import { serve } from "@hono/node-server";
import { Hono } from "hono";
import fs from "fs";
import sqlite3 from "sqlite3";
import { pino } from "pino";

import YfbApi from "./lib/YfbApi/index.js";

import PlayersSeed from "./seeders/Player.js";
import { execute, range, getUri } from "./lib/Utils/index.js";
import login from "./routes/login.js";
import callback from "./routes/callback.js";

const CLIENT_ID =
  "dj0yJmk9NWFQVWJadWZ4a3dNJmQ9WVdrOWRYTlFUbk5FWmswbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVl";

const CLIENT_SECRET = "add36b85715f4023f932adf55de4af46d1fd9716";

const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";

const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const app = new Hono();

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

const dbFilename = "fantasy-db";

fs.rm(dbFilename, () => {
  logger.info("Previous database wiped.");

  import("../authenticationToken.json")
    .then((module) => {
      const { authenticationToken } = module as any;

      const db = new sqlite3.Database(dbFilename);

      const yfbApi = YfbApi({
        authenticationToken,
      });

      PlayersSeed({
        db,
        yfbApi,
        execute,
        logger,
        range,
      }).seed({
        range,
        batchSize: 3,
        totalPlayers: 3,
      });
    })
    .catch((e) => logger.error(e));
});
