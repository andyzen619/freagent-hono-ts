import type { YfbPlayer } from "../lib/YfbApi/types.js";

type PlayerModel = {
  playerKey: string;
  id: number;
  name: string;
  primaryPosition: string;
  status?: string;
  team: string;
};

export default function Player() {
  return {
    async createFromYfbApi(player: YfbPlayer): Promise<PlayerModel> {
      const dbResponse = await execute<PlayerModel>(
        db,
        `INSERT INTO players (key, id, name, primaryPosition, status, team) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          player.player_key,
          player.player_id,
          player.name.full,
          player.primary_position,
          player.status,
          player.editorial_team_full_name,
        ]
      );

      const createdPlayer = {
        playerKey: dbResponse.playerKey,
        id: dbResponse.id,
        name: dbResponse.name,
        primaryPosition: dbResponse.primaryPosition,
        status: dbResponse.status,
        team: dbResponse.team,
      };

      return createdPlayer;
    },
    async createTable() {
      await execute(
        db,
        `CREATE TABLE IF NOT EXISTS players (
            key TEXT PRIMARY KEY,
            id INTEGER NOT NULL,
            name TEXT NOT NULL,
            primaryPosition TEXT NOT NULL,
            status TEXT,
            team TEXT NOT NULL
        );`
      );
    },
  };
}
