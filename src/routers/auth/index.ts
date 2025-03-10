import { Hono } from "hono";
import login from "./login.js";
import callback from "./callback.js";
import { getUri } from "../../lib/Utils.js";

import {
  CONST_YFB_AUTH_URL,
  CONST_YFB_CLIENT_ID,
  CONST_YFB_CLIENT_SECRET,
  CONST_YFB_TOKEN_URL,
} from "../../lib/YfbApi/constants.js";
import { logger } from "../../index.js";

export const auth = new Hono();

auth.get(
  "/login",
  login({
    CLIENT_ID: CONST_YFB_CLIENT_ID,
    AUTH_URL: CONST_YFB_AUTH_URL,
    getUri,
  })
);

auth.get(
  "/callback",
  callback({
    CLIENT_ID: CONST_YFB_CLIENT_ID,
    CLIENT_SECRET: CONST_YFB_CLIENT_SECRET,
    TOKEN_URL: CONST_YFB_TOKEN_URL,
    getUri,
    logger,
  })
);
