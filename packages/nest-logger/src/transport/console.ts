import {
  Color,
  jsonStringifySafe,
  type LogMeta,
  type LogFunction,
  type LoggerContext,
  type LogLevel
} from '@jshow/logger';
import { isNode, isTest } from '@jshow/nest-common';

import { isString, omit } from 'lodash-es';
import stripAnsi from 'strip-ansi';

import { coloredLogText, extractMessage } from '../utils';

/** 由 namespace 文本生成确定性的前景/背景色。 */
const makeContentStyle = (content: string): Color.LogColorStyle => {
  const majorColor = Color.makeColorHexFromText(content);
  const enhancedMajorColor = Color.betterLogColor(majorColor);

  return {
    backgroundColor: enhancedMajorColor,
    contentColor: Color.isDarkColor(enhancedMajorColor)
      ? [0, 0, 0]
      : [255, 255, 255]
  };
};

/** 将 namespace 片段格式化为 Node ANSI 或浏览器 CSS 输出。 */
const processColoringPrefixChunks: (
  namespace: NonNullable<LoggerContext['namespace']>
) => string[] = isNode
  ? namespace => {
      return [
        namespace
          .map(ns => Color.wrapColorANSI(ns, makeContentStyle(ns)))
          .join('/')
      ];
    }
  : namespace => {
      const { contents, styles } = namespace
        .map(ns => Color.wrapColorCSS(ns, makeContentStyle(ns)))
        .reduce(
          (collection, [content, style]) => {
            collection.contents.push(content);
            collection.styles.push(style);

            return collection;
          },
          { contents: [] as string[], styles: [] as string[] }
        );
      return [contents.join('/'), ...styles];
    };

/**
 * 创建 logger print 事件使用的 console transport。
 *
 * @returns 将 JSON 或文本日志写入 `console[level]` 的 transport。
 */
export const consoleTranportFactory =
  () =>
  (
    level: LogLevel,
    context: LoggerContext,
    messages: unknown[],
    getTimestamp: () => string | null
  ) => {
    const timestamp = getTimestamp();
    const { config, namespace = [], tags = {}, extra = {} } = context;
    // eslint-disable-next-line no-console
    const log = console[level] as LogFunction;

    if (context.config.format === 'json') {
      log(
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

    if (config.format === 'text') {
      const chunks: Array<unknown> = [''];

      if (timestamp) chunks.push(timestamp);

      if (config.enableNamespacePrefix && namespace.length) {
        chunks.push(
          ...(config.enableNamespacePrefixColors
            ? processColoringPrefixChunks(namespace)
            : [`${namespace.join('/')}`])
        );
      }

      chunks.push(...messages);
      if (config.appendTagsForTextPrint && Object.keys(tags).length) {
        chunks.push(
          config.transformTagsForTextPrint
            ? config.transformTagsForTextPrint(tags, context)
            : extractMessage(tags)
        );
      }

      if (config.appendExtraForTextPrint && Object.keys(extra).length) {
        chunks.push(
          config.transformExtraForTextPrint
            ? config.transformExtraForTextPrint(extra, context)
            : extractMessage(extra)
        );
      }

      const consoleInfo = chunks
        .map(msg =>
          isString(msg) ? msg : extractMessage((msg ?? {}) as LogMeta)
        )
        .join(' ');

      if (isTest) {
        switch (level) {
          case 'error':
            log(coloredLogText.bgRed(stripAnsi(consoleInfo)));
            break;
          case 'warn':
            log(coloredLogText.bgRedBright(stripAnsi(consoleInfo)));
            break;
          default:
            log(stripAnsi(consoleInfo));
        }
      } else {
        log(consoleInfo);
      }
    }

    if (config.hook) config.hook(level, context, ...messages);
  };
