import { BaseException, type ExceptionData } from './base';

//#region AccessDenied

/** 因缺少特性而授权失败的错误码。 */
export const ACCESS_DENIED = 'ACCESS_DENIED';

/** 描述被拒绝访问的类成员及所需特性集的载荷。 */
export interface AccessDeniedData extends ExceptionData {
  /** 被拒绝访问的类名。 */
  className: string;
  /** 被拒绝访问的成员名。 */
  memberName: string;
  /** 写入异常消息所需特性描述。 */
  featuresRequired: string;
}

/** 基于特性校验拒绝访问时的 HTTP 403 异常。 */
export class AccessDeniedException extends BaseException {
  /**
   * 创建访问拒绝异常。
   *
   * @param data 访问拒绝载荷。
   * @param status HTTP 状态码；默认 `403`。
   */
  constructor(data: AccessDeniedData, status = 403) {
    super(
      ACCESS_DENIED,
      `Forbidden resource: ${data.className}@${data.memberName}, required features:${data.featuresRequired || ''}`,
      data,
      status
    );
  }
}

//#endregion

//#region Unauthorized

/** 认证失败的错误码。 */
export const UNAUTHORIZED = 'UNAUTHORIZED';

/** 携带未授权响应消息的载荷。 */
export interface UnauthorizedExceptionData extends ExceptionData {
  /** 返回给客户端的消息。 */
  message: string;
}

/** 以载荷消息作为响应文本的 HTTP 401 未授权异常。 */
export class UnauthorizedException extends BaseException {
  /**
   * 创建未授权异常。
   *
   * @param data 未授权载荷。
   * @param status HTTP 状态码；默认 `401`。
   */
  constructor(data: UnauthorizedExceptionData, status = 401) {
    super(UNAUTHORIZED, data.message, data, status);
  }
}

//#endregion
