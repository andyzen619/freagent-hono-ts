import type { YfbPlayer } from "../lib/YfbApi/types.js";
import Player from "../models/Player.js";

import type { SeederInitParams } from "./types.js";

export default function ({ db, logger }: SeederInitParams) {
  return {
    seed: async function ({ dataToSeed }: { dataToSeed: YfbPlayer[] }) {
      logger.info("Seeding 'players' database ...");

      try {
        await Player(db).createTable();

        await dataToSeed.reduce(async (accPromise: any, player: YfbPlayer) => {
          const acc = await accPromise;

          const seedPlayer = await Player(db).createFromYfbApi(player);

          return [...acc, seedPlayer];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}
