type PlayerStatModel = {
  key: string;
  id: string;
  name: string;
  value: string;
};

type PlayerStatToSeed = {
  player_key: string;
  stat_id: string;
  name: string;
  value: string;
};

export default function PlayerStat() {
  return {
    async createFromYfbApi(
      playerStat: PlayerStatToSeed
    ): Promise<PlayerStatModel> {
      const dbResponse = await execute<PlayerStatModel>(
        db,
        `INSERT INTO player_stats (key, id, name, value) VALUES (?,?,?,?)`,
        [
          playerStat.player_key,
          playerStat.stat_id,
          playerStat.name,
          playerStat.value,
        ]
      );

      const createdPlayerStat = {
        key: dbResponse.key,
        id: dbResponse.id,
        name: dbResponse.name,
        value: dbResponse.value,
      };

      return createdPlayerStat;
    },
    async createTable() {
      await execute(
        db,
        `CREATE TABLE IF NOT EXISTS player_stats (
            key TEXT NOT NULL,
            id INTEGER NOT NULL,
            name TEXT,
            value TEXT NOT NULL,
            PRIMARY KEY (key, id), -- Composite key to avoid duplicate stats for a player
            FOREIGN KEY (key) REFERENCES players(key)
        );`
      );
    },
  };
}
