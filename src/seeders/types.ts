import sqlite3 from "sqlite3";
import pino from "pino";

import { execute, range } from "../lib/Utils/index.js";
import type { YfbApi } from "../lib/YfbApi/types.js";

export type SeederInitParams = {
  db: sqlite3.Database;
  yfbApi: YfbApi;
  execute: typeof execute;
  logger: pino.Logger;
  range: typeof range;
};
