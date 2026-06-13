/* eslint-disable @typescript-eslint/no-explicit-any */
import { useLogger } from '@jshow/logger';
import { useFastifyHeaders } from '@jshow/nest-common';

import { Injectable, type NestMiddleware } from '@nestjs/common';

import { pick } from 'lodash-es';

import { coloredLogText } from './utils/format';

/**
 * 立即记录请求开始，并通过响应 header hook 记录完成。
 *
 * @param text 日志正文前缀（含 method 与 path）。
 * @param res 响应对象。
 * @param req 可选请求对象，用于 extra 字段。
 */
const addRequestLogger = (text: string, res: any, req?: any) => {
  // route 字段与 extra 中其他字段语义重叠，统一在此构造。
  useLogger('Access')
    .fork({
      extra: {
        ...pick(req, ['headers', 'path', 'method', 'query']),
        route: req ? `[${req?.method}] ${req?.url}` : ''
      }
    })
    .info(`${coloredLogText.gray('BEGIN')} ${text}`);

  const startAt = process.hrtime();

  useFastifyHeaders(res, () => {
    const cost = process.hrtime(startAt);
    const value = cost[0] * 1e3 + cost[1] * 1e-6;
    const suffix = `${value.toFixed(4)}ms`;

    useLogger('Access')
      .fork({
        extra: {
          ...pick(req, ['headers', 'path', 'method', 'query']),
          route: req ? `[${req?.method}] ${req?.url}` : '',
          status: res.statusCode
        }
      })
      .info(
        `${coloredLogText.gray('  END')} ${text} ${coloredLogText.gray(suffix)}`
      );
  });
};

/** 记录 API 请求的 method、path、状态码与耗时的 Nest 中间件。 */
@Injectable()
export class ApiLoggerMiddleware implements NestMiddleware {
  /**
   * 记录 API 请求并调用下一个中间件。
   *
   * @param req 类请求对象。
   * @param res 类响应对象。
   * @param next Nest 中间件 continuation。
   */
  public use(req: any, res: any, next: (error?: any) => void) {
    addRequestLogger(
      `${coloredLogText.blue(req.method.padEnd(7, ' '))} ${req.path}`,
      res,
      req
    );
    next();
  }
}

/** 以固定 `OAUTH` method 标签记录 OAuth 请求的 Nest 中间件。 */
@Injectable()
export class OAuthLoggerMiddleware implements NestMiddleware {
  /**
   * 记录 OAuth 请求并调用下一个中间件。
   *
   * @param req 类请求对象。
   * @param res 类响应对象。
   * @param next Nest 中间件 continuation。
   */
  public use(req: any, res: any, next: (error?: any) => void) {
    addRequestLogger(
      `${coloredLogText.green('OAUTH'.padEnd(7, ' '))} ${req.path}`,
      res,
      req
    );
    next();
  }
}
