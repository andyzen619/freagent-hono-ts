import { logger } from "../index.js";
import {
  YfbGetPlayersOptionsStatusEnum,
  YfbGetPlayersOptionsSortEnum,
  YfbGetPlayersOptionsSortTypeEnum,
} from "../lib/YfbApi/types.js";

import type { YfbPlayer, YfbApi } from "../lib/YfbApi/types.js";

/**
 * Gets players from YFB API. The players object contains BOTH player data
 * and stats that need to be separated to seed for their individual tables.
 */
export const prepareSeedData = async ({
  jobs,
  batchSize,
  yfbApi,
}: {
  jobs: number[];
  batchSize: number;
  yfbApi: YfbApi;
}) => {
  const playersFromApi = await jobs.reduce<Promise<YfbPlayer[]>>(
    async (accPromise: Promise<any>, _: any, jobNumber: number) => {
      const acc = await accPromise;

      const count = batchSize;

      const start = jobNumber * count;

      try {
        const { players } = await yfbApi.getPlayers({
          count: `${count}`,
          start: `${start}`,
          status: YfbGetPlayersOptionsStatusEnum.A,
          sort: YfbGetPlayersOptionsSortEnum.AR,
          sort_type: YfbGetPlayersOptionsSortTypeEnum.lastweek,
        });

        return [...acc, ...players];
      } catch (error) {
        logger.error(error);

        return acc;
      }
    },
    Promise.resolve([])
  );

  return { dataToSeed: playersFromApi };
};
