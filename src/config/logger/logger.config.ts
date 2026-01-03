import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';

export function createWinstonOptions(
  appName = 'travel-api',
): WinstonModuleOptions {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  return {
    level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
    defaultMeta: {
      service: appName,
      env: process.env.NODE_ENV || 'development',
    },
    format: format.errors({ stack: true }),
    transports: createTransports(),
    handleExceptions: true,
  } as WinstonModuleOptions;
}

function createConsoleFormat(): any {
  return format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ level, message, timestamp, context, stack, ...meta }) => {
      const ctx = context ? ` [${context}]` : '';
      const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      const msg = stack ? `${message} \n${stack}` : message;
      return `${timestamp} ${level}${ctx}: ${msg}${rest}`;
    }),
  );
}

function createJsonFormat(): any {
  return format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    format.json(),
  );
}

function createTransports(): any[] {
  const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
  const level = process.env.LOG_LEVEL || (isProd ? 'info' : 'debug');

  const list: any[] = [
    new transports.Console({
      level,
      format: createConsoleFormat(),
      handleExceptions: true,
    }),
  ];

  if (process.env.LOG_FILE) {
    list.push(
      new transports.File({
        level,
        filename: process.env.LOG_FILE,
        format: createJsonFormat(),
        handleExceptions: true,
        maxsize: process.env.LOG_FILE_MAXSIZE
          ? Number(process.env.LOG_FILE_MAXSIZE)
          : undefined,
        maxFiles: process.env.LOG_FILE_MAXFILES
          ? Number(process.env.LOG_FILE_MAXFILES)
          : undefined,
      }),
    );
  }

  if (process.env.LOG_ERROR_FILE) {
    list.push(
      new transports.File({
        level: 'error',
        filename: process.env.LOG_ERROR_FILE,
        format: createJsonFormat(),
        handleExceptions: true,
      }),
    );
  }

  return list;
}
