import pino from "pino";

const pinoLogger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy/mm/dd HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
});

/**
 * @description Logger
 */
const logger = {
  info: (params: ILoggerParams) => {
    const { title, message, more } = params;
    pinoLogger.info({ title, more }, `[${title}] ${message}`);
  },
  warn: (params: ILoggerParams) => {
    const { title, message, more } = params;
    pinoLogger.warn({ title, more }, `[${title}] ${message}`);
  },
  error: (params: ILoggerParams) => {
    const { title, message, more } = params;
    pinoLogger.error({ title, more }, `[${title}] ${message}`);
  },
};

export default logger;

interface ILoggerParams {
  /** 标题 */
  title: string;
  /** 信息 */
  message: string;
  /** 更多信息 */
  more?: unknown;
}
