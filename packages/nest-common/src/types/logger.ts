/* eslint-disable @typescript-eslint/no-explicit-any */

/** 控制台与 Nest logger 集成共用的 logger 接口。 */
export interface NestLogger {
  /** 记录 debug 消息或对象。 */
  debug(str: string | object): void;

  /** 记录格式化的 debug 消息。 */
  debug(format: string, ...mixed: any[]): void;

  /** 记录 info 消息或对象。 */
  info(str: string | object): void;

  /** 记录格式化的 info 消息。 */
  info(format: string, ...mixed: any[]): void;

  /** 记录标准 log 消息或对象。 */
  log(str: string | object): void;

  /** 记录格式化的标准 log 消息。 */
  log(format: string, ...mixed: any[]): void;

  /** 记录 warn 消息或对象。 */
  warn(str: string | object): void;

  /** 记录格式化的 warn 消息。 */
  warn(format: string, ...mixed: any[]): void;

  /** 记录 error 消息或对象。 */
  error(str: string | object): void;

  /** 记录格式化的 error 消息。 */
  error(format: string, ...mixed: any[]): void;
}
