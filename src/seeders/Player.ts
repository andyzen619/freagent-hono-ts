import { range } from "../lib/Utils.js";
import type { YfbPlayer } from "../lib/YfbApi/types.js";
import Player from "../models/Player.js";

import type { SeederInitParams } from "./types.js";

export default function ({ db, execute, logger }: SeederInitParams) {
  type RangeFunction = typeof range;

  return {
    seed: async function ({ playersToSeed }: { playersToSeed: YfbPlayer[] }) {
      logger.info("Seeding 'players' database ...");

      try {
        await Player(db).createTable();

        await playersToSeed.reduce(
          async (accPromise: any, player: YfbPlayer) => {
            const acc = await accPromise;

            const seedPlayer = await Player(db).createFromYfbApi(player);

            return [...acc, seedPlayer];
          },
          []
        );
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}
