import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

import type { Database } from "./types.ts";

const database = new Kysely<Database>({
  dialect: new SqliteDialect({
    database: new SQLite("fantasy-db.db"),
  }),
});

export default database;
