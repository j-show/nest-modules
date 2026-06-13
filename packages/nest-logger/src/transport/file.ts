import fs from 'node:fs';
import path from 'node:path';

import {
  type LoggerContext,
  type LogLevel,
  jsonStringifySafe,
  type LogMeta
} from '@jshow/logger';

import { default as dayjs } from 'dayjs';
import { isString, omit } from 'lodash-es';

import { extractMessage } from '../utils';

const fileDirSet = new Set<string>();
const fileBulkQueue: string[] = [];
/** 文件日志批量 flush 间隔（毫秒）。 */
const fileUpdateInterval = 1000;
/** 文本模式下触发即时 flush 的队列长度阈值。 */
const fileUpdateBulkSize = 100;

/** 异步将队列内容追加到按日命名的 app 日志文件。 */
const wrtiteLogToFile = (content: string, dir: string) => {
  const fn = path.resolve(dir, `app-${dayjs().format('YYYY-MM-DD')}.log`);

  process.nextTick(async () => {
    await fs.promises.appendFile(fn, content);
    fileBulkQueue.splice(0, fileBulkQueue.length);
  });
};

/**
 * 启动共享文件日志队列的周期性 flush 定时器。
 *
 * @param dir 写入按日日志文件的目录。
 */
export const registerFileTimer = (dir: string) => {
  if (fileDirSet.has(dir)) return;

  fileDirSet.add(dir);
  fs.mkdirSync(dir, { recursive: true });

  setInterval(() => {
    if (fileBulkQueue.length < 1) return;
    wrtiteLogToFile(fileBulkQueue.join('\n'), dir);
  }, fileUpdateInterval);
};

/**
 * 创建 logger print 事件使用的 file transport。
 *
 * @param dir 写入按日日志文件的目录。
 * @returns 缓冲 JSON 或文本日志后再写文件的 transport。
 */
export const fileTransportFactory =
  (dir: string) =>
  (
    level: LogLevel,
    context: LoggerContext,
    messages: unknown[],
    getTimestamp: () => string | null
  ) => {
    const timestamp = getTimestamp();
    const { config, namespace = [], tags = {}, extra = {} } = context;

    if (config.format === 'json') {
      fileBulkQueue.push(
        jsonStringifySafe({
          level,
          ...omit(context, 'config'),
          messages: messages
            .map(
              current =>
                isString(current)
                  ? current
                  : `${extractMessage(current as LogMeta)}`,
              ''
            )
            .join(','),
          timestamp
        })
      );
    }

    let content = '';
    if (config.format === 'text') {
      if (timestamp) content += timestamp;

      if (config.enableNamespacePrefix && namespace.length) {
        content += `${namespace.join('/')}`;
      }
      if (content) content += ' ';

      if (config.appendTagsForTextPrint && Object.keys(tags).length) {
        content += extractMessage(tags);
      }
      if (content) content += ' ';

      if (config.appendExtraForTextPrint && Object.keys(extra).length) {
        content += extractMessage(extra);
      }

      content += messages
        .map(msg => (isString(msg) ? msg : extractMessage(msg as LogMeta)))
        .join(' ');

      fileBulkQueue.push(content);
      if (fileBulkQueue.length >= fileUpdateBulkSize) {
        wrtiteLogToFile(`${fileBulkQueue.join('\n')}\n`, dir);
      }

      if (config.hook) config.hook(level, context, ...messages);
    }
  };
