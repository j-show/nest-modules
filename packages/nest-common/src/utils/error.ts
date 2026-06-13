/**
 * 将字符串、`Error` 或类 error 值转换为 `Error` 实例。
 *
 * @param errorLikeOrMessage 源 error、消息或可序列化值。
 * @param headMessage 可选前缀，拼接在解析后的消息之前。
 * @returns 已有或新创建的 `Error` 实例。
 */
export const ensureError = (
  errorLikeOrMessage: string | Error | unknown,
  headMessage?: string
) => {
  if (typeof errorLikeOrMessage === 'string') {
    if (headMessage) return new Error(`${headMessage};  ${errorLikeOrMessage}`);
    return new Error(errorLikeOrMessage);
  }

  if (errorLikeOrMessage instanceof Error) {
    if (headMessage)
      errorLikeOrMessage.message = `${headMessage};  ${errorLikeOrMessage.message}`;
    return errorLikeOrMessage;
  }

  if (
    typeof errorLikeOrMessage === 'object' &&
    errorLikeOrMessage &&
    Reflect.has(errorLikeOrMessage, 'message')
  ) {
    if (headMessage)
      return new Error(
        `${headMessage};  ${Reflect.get(errorLikeOrMessage, 'message')}`
      );
    return new Error(Reflect.get(errorLikeOrMessage, 'message') || '<unknown>');
  }

  if (headMessage)
    return new Error(`${headMessage};  ${JSON.stringify(errorLikeOrMessage)}`);

  return new Error(JSON.stringify(errorLikeOrMessage));
};

/**
 * 从字符串、`Error`、类 error 对象或可序列化值中提取消息字符串。
 *
 * @param errorLikeOrMessage 源 error、消息或可序列化值。
 * @returns 解析后的消息文本。
 */
export const ensureErrorMessage = (
  errorLikeOrMessage: string | Error | unknown
) => {
  if (typeof errorLikeOrMessage === 'string') return errorLikeOrMessage;

  if (errorLikeOrMessage instanceof Error) return errorLikeOrMessage.message;

  if (
    typeof errorLikeOrMessage === 'object' &&
    errorLikeOrMessage &&
    Reflect.has(errorLikeOrMessage, 'message')
  ) {
    return Reflect.get(errorLikeOrMessage, 'message') as string;
  }

  return JSON.stringify(errorLikeOrMessage);
};
