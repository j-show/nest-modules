import fs from 'node:fs';

import { jsonStringifySafe, type LogMeta } from '@jshow/logger';
import { getConfig, isProd, UUID } from '@jshow/nest-common';

import chalk from 'chalk';
import { default as dayjs } from 'dayjs';
import path from 'path';
import { renderString } from 'prettyjson';
import stripAnsi from 'strip-ansi';

const CONFIG_KEY_TIME_FORMAT = 'logger.timeFormat';
const CONFIG_KEY_PERSISTENCE_FILE_META = 'logger.persistence.file.meta';

/** 基于 `chalk` 的终端着色工具。 */
export const coloredLogText = chalk;

const padIndent = (text: string) => {
  const prefix = ''.padStart(4, ' ');
  return text.replace(/^/gm, prefix);
};

const metaIdent = new Array(16).fill(' ').join('');

const prettyOptions = isProd ? { noColor: true } : {};

const normalMeta = (data: unknown) => {
  return renderString(jsonStringifySafe(data), prettyOptions);
};

const writeFileMeta = (filename: string, data: unknown) => {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, data as string);
};

/**
 * 格式化 metadata；超长渲染结果写入带时间戳的文件路径。
 *
 * @param meta 大型 metadata 文件的目录前缀。
 * @param data 待渲染的 metadata 值。
 * @returns 缩进后的 metadata 文本，或大型输出时的文件引用。
 */
export const smartMeta = (meta: string, data: unknown) => {
  let output = normalMeta(data);

  if (output.split('\n').length > 8) {
    const filename = `${meta}/${dayjs().format('YYYY-MM-DD')}/${UUID()}`;
    writeFileMeta(filename, stripAnsi(output));

    // WebStorm 用户可通过 "file:///" 前缀直接打开文件。
    output = coloredLogText.gray(
      ` . . . big meta wrote to "file://${filename}"`
    );
  }

  return output.replace(/^/gm, metaIdent);
};

const getFormatMixed =
  (key = CONFIG_KEY_PERSISTENCE_FILE_META) =>
  (data: unknown) => {
    const meta = getConfig(key);
    return meta ? smartMeta(meta, data) : normalMeta(data);
  };

/**
 * 从配置创建时间戳格式化函数。
 *
 * @param key 含 dayjs 时间格式的配置键。
 * @returns 返回格式化时间戳的函数；未配置时返回 `null`。
 */
export const createLogTimestamp = (key = CONFIG_KEY_TIME_FORMAT) => {
  const timeFormat = getConfig(key);
  if (!timeFormat) return () => null;

  return () => {
    const text = dayjs().format(timeFormat);
    return isProd ? text : coloredLogText.gray(text);
  };
};

/**
 * 从 logger metadata、错误、stack 与 extra 字段提取格式化文本。
 *
 * @param info 待格式化的 metadata 或类 error 对象。
 * @param keyLogMeta 大型 metadata 文件输出的可选配置键。
 * @returns 格式化后的消息文本。
 */
export const extractMessage = (
  info?: {
    stack?: string[] | string;
    message?: string | Error;
    context?: string;
  } & LogMeta,
  keyLogMeta?: string
): string => {
  if (!info) return '';

  const texts: string[] = [];

  const { stack, message, ...rest } = info;
  const formatMixed = getFormatMixed(keyLogMeta);

  if (info instanceof Error) {
    texts.push(formatMixed(info));
  } else if (message instanceof Error) {
    texts.push(
      message.stack ? formatMixed(message) : padIndent(message.toString())
    );
  } else {
    if (message != null) {
      const msgStr = info.toString();
      if (msgStr === '[object Object]') {
        const type = typeof message;
        texts.push(
          type === 'number' || type === 'string'
            ? message
            : formatMixed(message)
        );
      } else {
        texts.push(padIndent(msgStr));
      }
    }

    if (stack) {
      texts.push(
        `\n${padIndent(Array.isArray(stack) ? stack.join('\n') : stack)}`
      );
    }
  }

  const stringified = info.toString();
  if (stringified !== '[object Object]') {
    texts.push(`\n${padIndent(stringified)}`);
  }

  if (Object.keys(rest).length > 0) {
    texts.push(`\n${formatMixed({ ...rest })}`);
  }

  return texts.join('');
};
