import playerStats from "./playerStats";

export default function initGraphql() {
  return {
    Query: {
      ...playerStats.Query,
      helloWorld: (): string => {
        return "HELLO WORLD!";
      },
    },
  };
}
