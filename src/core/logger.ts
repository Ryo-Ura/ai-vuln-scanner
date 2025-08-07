import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "yyyy-mm-dd HH:MM:ss.l o",
            ignore: "pid,hostname",
        },
    },
    base: { pid: false }, // don’t include pid in every log
    serializers: pino.stdSerializers, // properly format errors, requests, res, etc.
});

export default logger;
