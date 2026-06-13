import {
  type LoggerSubContext,
  type CoreLoggerFactory,
  type LoggerConfig,
  type LoggerContext,
  configure,
  type LoggerProxyHandler,
  type LogFunction,
  type LogLevel
} from '@jshow/logger';
import { getConfig, isProd, stripUndefined } from '@jshow/nest-common';

import { flatten } from 'lodash-es';

import {
  consoleTranportFactory,
  fileTransportFactory,
  logstashTransport,
  registerFileTimer,
  getEnabledLogstash
} from './transport';
import { type ErrorLiked } from './types';
import { createLogTimestamp } from './utils';

const CONFIG_KEY_FORMAT = 'logger.format';
const CONFIG_KEY_PERSISTENCE_FILE_DIR = 'logger.persistence.file';

/** 读取配置的 logger 输出格式，默认 `text`。 */
const getFormat = (key = CONFIG_KEY_FORMAT) =>
  getConfig<LoggerConfig['format']>(key, 'text', (val: unknown) =>
    ['text', 'json'].includes(val as string)
  );

/** 读取配置的日志文件目录。 */
const getLogFileDir = (key = CONFIG_KEY_PERSISTENCE_FILE_DIR) => getConfig(key);

/**
 * 构建传给 `@jshow/logger` 的 logger 配置。
 *
 * @param key 输出格式的可选配置键。
 * @returns 移除 `undefined` 后的部分 logger 配置。
 */
export const getLoggerConfig = (key?: string): Partial<LoggerConfig> => {
  const format = getFormat(key);

  return stripUndefined({
    format,
    enableNamespacePrefix: true,
    appendExtraForTextPrint: format === 'json' || isProd,
    appendTagsForTextPrint: format === 'json' || isProd
  } as LoggerConfig);
};

/**
 * 创建将日志分发到 console、file、Logstash 的 core factory。
 *
 * @param key 覆盖 format、Logstash 开关与文件目录查找的可选配置键。
 * @returns `@jshow/logger` 使用的 logger core factory。
 */
const LoggerFactory: CoreLoggerFactory<LoggerContext> = (key?: {
  format?: string;
  logstash?: string;
  fileDir?: string;
}) => {
  const format = getFormat(key?.format);
  const fileDir = getLogFileDir(key?.fileDir);
  const enableLogstashClient = getEnabledLogstash(key?.logstash);

  const fileTransport = fileTransportFactory(fileDir);
  const consoleTransport = consoleTranportFactory();
  const logTs = createLogTimestamp();

  if (fileDir) registerFileTimer(fileDir);

  return {
    write: () => {},
    print: ({ level, context }, ...messages) => {
      consoleTransport(level, context, messages, logTs);

      if (fileDir) {
        fileTransport(level, context, flatten(messages), logTs);
      }

      if (enableLogstashClient && format === 'json') {
        logstashTransport(level, context, flatten(messages), logTs);
      }
    }
  };
};

/** 带 namespace/tags/extra 的 logger 代理，将类 Error 对象拆分为 message 与 stack。 */
const processLoggerProxy: LoggerProxyHandler<LoggerContext> = (
  target,
  key,
  self,
  meta = {}
) => {
  const func = Reflect.get(target, key, self) as LogFunction;
  if (typeof func !== 'function') {
    return (...msg: unknown[]) => console.error('[FALLBACK LOGGER]', ...msg);
  }

  const namespace = meta?.namespace as LoggerSubContext['namespace'];
  const tags = meta?.tags as LoggerSubContext['tags'];
  const extra = meta?.extra as LoggerSubContext['extra'];

  return (msg: string | ErrorLiked, ...otherMsgs: unknown[]) => {
    if (!namespace) return func(msg, ...otherMsgs);

    let ctx: LoggerSubContext;
    let data: unknown[];

    if (
      typeof msg === 'object' &&
      Reflect.has(msg, 'message') &&
      Reflect.has(msg, 'stack')
    ) {
      const { message, stack, ...rest } = msg;

      ctx = {
        namespace,
        tags,
        extra: { ...rest, ...extra, stack }
      } as LoggerSubContext;

      data = [message, stack, ...otherMsgs];
    } else {
      ctx = {
        namespace,
        tags,
        extra
      } as LoggerSubContext;

      data = [msg, ...otherMsgs];
    }

    return target.fork(ctx)?.[key as LogLevel]?.(...data);
  };
};

/**
 * 向 `@jshow/logger` 注册 Nest logger factory、proxy handler 与默认配置。
 *
 * @param config 可选局部配置，覆盖 `getLoggerConfig()` 默认值。
 */
export const initNestLogger = (config?: Partial<LoggerConfig>) => {
  configure({
    createCoreLogger: LoggerFactory,
    processLoggerProxy,
    config: config ?? getLoggerConfig()
  });
};
