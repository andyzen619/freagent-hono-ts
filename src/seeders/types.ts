import sqlite3 from "sqlite3";
import pino from "pino";

import { execute } from "../lib/Utils/index.js";

export type SeederInitParams = {
  db: sqlite3.Database;
  execute: typeof execute;
  logger: pino.Logger;
};
