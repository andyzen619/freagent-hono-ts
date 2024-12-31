type PlayerStat = {
  fullName: string;
  statName: string;
  statValue: number;
};

export default {
  Query: {
    playerStats: (): PlayerStat[] => {
      return [];
    },
  },
};
