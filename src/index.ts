import { serve } from "@hono/node-server";
import { Hono } from "hono";
import fs from "fs";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import sqlite3 from "sqlite3";
import { promisify } from "util";

import { authenticationToken } from "../authenticationToken.json";
import YahooFantasyBasketballApi from "./lib/YahooFantasyBasketballApi/index.js";

// Replace these with your Yahoo app credentials
const CLIENT_ID =
  "dj0yJmk9NWFQVWJadWZ4a3dNJmQ9WVdrOWRYTlFUbk5FWmswbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PWVl";
const CLIENT_SECRET = "add36b85715f4023f932adf55de4af46d1fd9716";
const REDIRECT_URI = "https://e81c-174-88-88-64.ngrok-free.app/callback";

// Yahoo API URLs
const AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";
const TOKEN_URL = "https://api.login.yahoo.com/oauth2/get_token";
const FANTASY_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Fantasy!");
});

app.get("/login", (c) => {
  const authParams = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    language: "en-us",
  });

  const authUrl = `${AUTH_URL}?${authParams.toString()}`;

  return c.redirect(authUrl);
});

app.get("/callback", async (c) => {
  const { code } = c.req.query();

  try {
    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const authenticationToken = tokenResponse.data.access_token;

    fs.writeFileSync(
      "authenticationToken.json",
      JSON.stringify({ authenticationToken })
    );

    return c.text("Authentication successful! You can now use the API.");
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Error fetching access token:", error.response?.data);

      return c.text("Authentication failed: " + error.response?.data?.error);
    }

    console.error("An unexpected error occurred:", error);

    return c.text("Authentication failed due to an unexpected error.", 500);
  }
});

app.get("/league", async (c) => {
  if (!authenticationToken) {
    return c.text("You need to authenticate first!", 401);
  }

  let url = `${FANTASY_API_URL}/league/nba.l.102182`;

  const query = c.req.query();

  url = Object.keys(query).reduce((acc, curr) => {
    return acc + `/${curr}`;
  }, url);

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authenticationToken}`,
      },
    });

    return c.text(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch fantasy data: ", error.response?.data);

      return c.text("Failed to fetch fantasy data");
    }

    console.error("An unexpected error occurred:", error);

    return c.text(
      "Failed to fetch fantasy data due to an unexpected error.",
      500
    );
  }
});

app.get("/players", async (c) => {
  if (!authenticationToken) {
    return c.text("You need to authenticate first!", 401);
  }

  let url = `${FANTASY_API_URL}/league/nba.l.102182/players;status=A;count=3;start=0`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${authenticationToken}`,
      },
    });

    const XMLdata = response.data;

    const parser = new XMLParser();

    let jObj = parser.parse(XMLdata);

    return c.json(jObj);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Failed to fetch fantasy data: ", error.response?.data);

      return c.text("Failed to fetch fantasy data");
    }

    console.error("An unexpected error occurred:", error);

    return c.text(
      "Failed to fetch fantasy data due to an unexpected error.",
      500
    );
  }
});

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

// Function to promisify database operations
const execute = promisify((db: sqlite3.Database, sql: string, params?: any[]) =>
  db.run(sql, params || [])
);

async function seedDb() {
  console.log("Seeding SQL DB ...");

  const db = new sqlite3.Database("fantasy-db");

  try {
    await execute(
      db,
      `CREATE TABLE IF NOT EXISTS players (
        player_key TEXT PRIMARY KEY,
        player_id INTEGER NOT NULL,
        primary_position TEXT NOT NULL
      )`
    );

    const YahooFantasyBasketball = YahooFantasyBasketballApi({
      authenticationToken,
    });

    const { players } = await YahooFantasyBasketball.getPlayers();

    for (const player of players) {
      db.run(
        `INSERT OR REPLACE INTO players (player_key, player_id, primary_position) VALUES (?, ?, ?)`,
        [player.player_key, player.player_id, player.primary_position],
        () => {
          console.log(`Inserted: ${player.name.full}`);
        }
      );
    }

    console.log("Seeding completed successfully.");

    db.get(`select * from players where player_id = 4152`, (error, rows) => {
      console.log(rows);
    });
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    db.close();
  }
}

seedDb();
