import { pino } from "pino";

export const initLogger = () =>
  pino({
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  });
