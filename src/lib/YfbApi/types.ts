export type InitializationParams = {
  authenticationToken: string;
};

export type YahooFantasyBasketballApiResponse = {
  players: Player[];
};

export type Player = {
  player_key: string;
  player_id: number;
  name: {
    full: string;
    first: string;
    last: string;
    ascii_first: string;
    ascii_last: string;
  };
  url: string;
  status: string;
  status_full: string;
  injury_note: string;
  editorial_player_key: string;
  editorial_team_key: string;
  editorial_team_full_name: string;
  editorial_team_abbr: string;
  editorial_team_url: string;
  is_keeper: {
    status: string;
    cost: string;
    kept: string;
  };
  uniform_number: number;
  display_position: string;
  headshot: {
    url: string;
    size: string;
  };
  image_url: string;
  is_undroppable: number;
  position_type: string;
  primary_position: string;
  eligible_positions: {
    position: string[];
  };
  eligible_positions_to_add: {
    position: string[];
  };
  has_player_notes: number;
  player_notes_last_timestamp: number;
  player_stats: PlayerStat;
  player_advanced_stats: PlayerStat;
};

export type PlayerStat = {
  coverage_type: string;
  stats: PlayerStatList;
};

export type PlayerStatList = {
  stat: PlayerStatListItem[];
};

export type PlayerStatListItem = {
  stat_id: Number;
  value: Number | string;
};

/**
 * Options for filtering player status.
 */
export enum GetPlayersOptionsStatusEnum {
  /** All available players */
  A = "A",
  /** Free agents only */
  FA = "FA",
  /** Waivers only */
  W = "W",
  /** All taken players */
  T = "T",
  /** Keepers only */
  K = "K",
}

/**
 * Options for sorting players.
 */
export enum GetPlayersOptionsSortEnum {
  /** Sort by name */
  NAME = "NAME",
  /** Sort by overall ranking */
  OR = "OR",
  /** Sort by average ranking */
  AR = "AR",
  /** Sort by points */
  PTS = "PTS",
}

export enum GetPlayersOptionsSortTypeEnum {
  season = "season",
  date = "date",
  lastweek = "lastweek",
  lastmonth = "lastmonth",
}

export type GetPlayersOptionsParams = {
  count?: string;
  start?: string;
  status?: GetPlayersOptionsStatusEnum;
  sort?: string | GetPlayersOptionsSortEnum;
  sort_type?: GetPlayersOptionsSortTypeEnum;
};

export type StatCategory = {
  stat_id: number;
  enabled: number;
  name: string;
  display_name: string;
  group: string;
  abbr: string;
  sort_order: number;
  position_type: string;
};

export type YfbApi = {
  getPlayers: (
    options?: GetPlayersOptionsParams
  ) => Promise<YahooFantasyBasketballApiResponse>;
  getStatCategories: () => Promise<StatCategory[]>;
};
