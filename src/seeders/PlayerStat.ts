import type { SeederInitParams } from "./types.js";
import type { YfbPlayer, YfbStatCategory } from "../lib/YfbApi/types.js";
import PlayerStat from "../models/PlayerStat.js";

export default function PlayerStats({ db, logger }: SeederInitParams) {
  return {
    seed: async function ({
      dataToSeed,
      statCategories,
    }: {
      dataToSeed: YfbPlayer[];
      statCategories: YfbStatCategory[];
    }) {
      logger.info("Seeding 'player_stats' database ...");

      try {
        await PlayerStat(db).createTable();

        await dataToSeed.reduce(async (accPromise: any, player: YfbPlayer) => {
          const acc = await accPromise;

          const statsToSeed = player.player_stats.stats.stat.map(
            ({ stat_id, value }) =>
              setNameOnStat({
                stat_id,
                value,
                player_key: player.player_key,
                statCategories,
              })
          );

          const promises = statsToSeed.map(async (playerStat) =>
            PlayerStat(db).createFromYfbApi(playerStat)
          );

          const seededStatsForPlayer = await Promise.all(promises);

          return [...acc, { key: player.player_key, seededStatsForPlayer }];
        }, []);
      } catch (error) {
        logger.error(error, "Error during seeding: ");
      }
    },
  };
}

export function setNameOnStat({ statCategories, stat_id, player_key, value }): {
  player_key: string;
  stat_id: string;
  name: string;
  value: string;
} {
  const statCategory = statCategories.find(
    ({ stat_id: statIdToMatch }: { stat_id: number }) =>
      stat_id === statIdToMatch
  );

  return {
    player_key,
    stat_id,
    name: statCategory ? statCategory.display_name : "UNKNOWN",
    value,
  };
}
