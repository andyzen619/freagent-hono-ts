import axios, { type AxiosResponse } from "axios";
import { XMLParser } from "fast-xml-parser";
import YfbApiError from "./YfbApiError.js";
import { handleAxiosError, isTokenExpired } from "./utils.js";

const YAHOO_FANTASY_API_URL = "https://fantasysports.yahooapis.com/fantasy/v2";

import type {
  YfbGetPlayersOptionsParams,
  YfbApiInitializationParams,
  YfbApi,
  YfbApiResponse,
} from "./types.ts";

export default function ({
  authenticationToken,
}: YfbApiInitializationParams): YfbApi {
  const parser = new XMLParser();

  return {
    getPlayers: async (options: YfbGetPlayersOptionsParams = {}) => {
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

      return { players: data } as YfbApiResponse;
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
