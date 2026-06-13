import { type LogMeta } from '@jshow/logger';

/** 扩展 `LogMeta` 的错误日志元数据。 */
export interface ErrorMeta<T = { [key: string]: string }> extends LogMeta {
  /** 可选标签集合。 */
  setTags?: T;
}

/** 类 Error 对象：含 `stack`、`message`、`name` 属性。 */
export type ErrorLiked =
  | Error
  | { stack: string; message: string; name: string };
