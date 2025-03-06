import sqlite3 from "sqlite3";

// Overload signatures for better type inference
export function execute<T>(
  db: sqlite3.Database,
  sql: string,
  params?: any[]
): Promise<T>;

export function execute<T>(
  db: sqlite3.Database,
  sql: string,
  params?: any[]
): Promise<T[]>;

// Implementation
export function execute<T>(
  db: sqlite3.Database,
  sql: string,
  params?: any[]
): Promise<T | T[]> {
  return new Promise((resolve, reject) => {
    const sqlType = sql.trim().split(" ")[0].toUpperCase();

    if (sqlType === "SELECT") {
      // SELECT queries return multiple rows
      db.all(sql, params, (err, rows: T[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows); // Resolves as an array of type `T[]`
        }
      });
    } else if (
      sqlType === "INSERT" ||
      sqlType === "UPDATE" ||
      sqlType === "DELETE"
    ) {
      // INSERT, UPDATE, DELETE with `RETURNING` return a single row
      db.get(`${sql} RETURNING *`, params, (err, row: T) => {
        if (err) {
          reject(err);
        } else {
          resolve(row); // Resolves as type `T`
        }
      });
    } else {
      // Other queries resolve with metadata
      db.run(sql, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes,
          } as unknown as T); // Resolves metadata as type `T`
        }
      });
    }
  });
}
