import axios, { type AxiosResponse } from "axios";
import { XMLParser } from "fast-xml-parser";
import YfbApiError from "./errors/YfbApiError.js";

const YAHOO_FANTASY_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";

type InitializationParams = {
  authenticationToken: string;
};

type YahooFantasyBasketballApiResponse = {
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

type PlayerStat = {
  coverage_type: string;
  stats: PlayerStatList;
};

type PlayerStatList = {
  stat: PlayerStatListItem[];
};

type PlayerStatListItem = {
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

type GetPlayersOptionsParams = {
  count?: string;
  start?: string;
  status?: GetPlayersOptionsStatusEnum;
  sort?: string | GetPlayersOptionsSortEnum;
  sort_type?: GetPlayersOptionsSortTypeEnum;
};

type StatCategory = {
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

export default function ({
  authenticationToken,
}: InitializationParams): YfbApi {
  const parser = new XMLParser();

  return {
    getPlayers: async (options: GetPlayersOptionsParams = {}) => {
      const {
        count = "3",
        start = "0",
        status = "A",
        sort = "OR",
        sort_type = "season",
      } = options;

      // Semicolon-separated parameters
      const pathParams = {
        status,
        count,
        start,
        sort,
        sort_type,
      };

      // Convert the parameters to a semicolon-separated string
      const pathParamsString = Object.entries(pathParams)
        .map(([key, value]) => `${key}=${value}`)
        .join(";");

      // Construct the base URL
      const url = `${YAHOO_FANTASY_API_URL}/league/nba.l.102182/players;${pathParamsString}/stats`;

      let response;

      try {
        response = await axios.get(url.toString(), {
          headers: {
            Authorization: `Bearer ${authenticationToken}`,
          },
          transformResponse: [
            (data) => {
              const errorDescription = isTokenExpired(data);

              if (errorDescription) {
                throw new Error(errorDescription);
              }

              const XMLdata = data;

              let jObj = parser.parse(XMLdata);

              const { fantasy_content, error } = jObj;

              if (error) {
                const { description, detail } = error;

                const errorToThrow = new YfbApiError({
                  message: description,
                  detail,
                });

                errorToThrow.detail = detail;

                throw errorToThrow;
              }

              const { league } = fantasy_content;

              const { players } = league;

              const { player: arrayOfPlayers } = players;

              return arrayOfPlayers;
            },
          ],
        });
      } catch (error) {
        handleAxiosError(error, parser);
      }

      const { data } = response as AxiosResponse;

      return { players: data } as YahooFantasyBasketballApiResponse;
    },
    getStatCategories: async () => {
      const url = `${YAHOO_FANTASY_API_URL}/league/nba.l.102182/settings`;

      let response;

      try {
        response = await axios.get(url.toString(), {
          headers: {
            Authorization: `Bearer ${authenticationToken}`,
          },
          transformResponse: [
            (data) => {
              const errorDescription = isTokenExpired(data);

              if (errorDescription) {
                throw new Error(errorDescription);
              }

              const XMLdata = data;

              let jObj = parser.parse(XMLdata);

              const { fantasy_content } = jObj;

              const { settings } = fantasy_content.league;

              const { stat_categories } = settings;

              return stat_categories.stats.stat;
            },
          ],
        });
      } catch (error) {
        handleAxiosError(error, parser);
      }

      const { data } = response as AxiosResponse;

      return data;
    },
  };
}

function handleAxiosError(error: any, parser: XMLParser) {
  let errorToThrow = error;

  if (axios.isAxiosError(error)) {
    const { response } = error;

    const errorStatusCode = response?.status || 500;

    errorToThrow.code = errorStatusCode;

    if (errorStatusCode === 401) {
      errorToThrow = new Error("Unable to authenticate API request");

      errorToThrow.externalVendorApiDetails = response?.data.error.description;

      errorToThrow.name = "UnauthenticatedError";

      throw errorToThrow;
    }

    if (errorStatusCode >= 400 && errorStatusCode <= 500) {
      const parsedResponse = parser.parse(response?.data);

      const { error: apiError } = parsedResponse;

      errorToThrow = new Error("Unable to process API request");

      errorToThrow.externalVendorApiDetails = apiError.description;

      errorToThrow.name = "RequestError";

      errorToThrow.request = {
        method: response?.config.method,
        url: response?.config.url,
        data: response?.config.data,
      };

      throw errorToThrow;
    }
  }

  throw errorToThrow;
}

function isTokenExpired(data: string) {
  try {
    const { error } = JSON.parse(data);

    return `${error.description}`;
  } catch (error) {
    return "";
  }
}
