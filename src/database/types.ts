import type { Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  players: PlayersTable;
  player_stats: PlayerStatsTable;
}

export interface PlayersTable {
  key: string;
  id: number;
  name: string;
  primaryPosition: "PG" | "SG" | "G" | "SF" | "F" | "C";
  status: string;
  team: string;
}

export type DbPlayer = Selectable<PlayersTable>;
export type DbNewPlayer = Insertable<PlayersTable>;
export type DbPlayerUpdate = Updateable<PlayersTable>;

export interface PlayerStatsTable {
  key: string;
  id: string;
  name:
    | "FGM/A"
    | "3PTM"
    | "PTS"
    | "REB"
    | "AST"
    | "ST"
    | "BLK"
    | "TO"
    | "FG%"
    | "FTM/A"
    | "FT%";
  value: string;
}

export type DbPlayerStat = Selectable<PlayerStatsTable>;
export type DbNewPlayerStat = Insertable<PlayerStatsTable>;
export type DbPlayerStatUpdate = Updateable<PlayerStatsTable>;
