import { BaseException, type ExceptionData } from './base';

//#region EmptyParameter

/** 必填参数为空时的错误码。 */
export const EMPTY_PARAMETER = 'EMPTY_PARAMETER';

/** 命名空参数的载荷。 */
export interface EmptyParameterExceptionData extends ExceptionData {
  /** 用于生成消息的参数名。 */
  name: string;
}

/** 参数值为空时的 HTTP 400 异常。 */
export class EmptyParameterException extends BaseException {
  /**
   * 创建空参数异常。
   *
   * @param data 空参数载荷。
   * @param status HTTP 状态码；默认 `400`。
   */
  constructor(data: EmptyParameterExceptionData, status = 400) {
    super(
      EMPTY_PARAMETER,
      `Value of prarameter '${data.name}' is empty!`,
      data,
      status
    );
  }
}

//#endregion

//#region InvalidParameter

/** 参数值无效时的错误码。 */
export const INVALID_PARAMETER = 'INVALID_PARAMETER';

/** 命名无效参数及可选原因的载荷。 */
export interface InvalidParameterExceptionData extends ExceptionData {
  /** 用于生成消息的参数名。 */
  name: string;
  /** 可选原因，保留在载荷中。 */
  reason?: string;
}

/** 参数值无效时的 HTTP 400 异常。 */
export class InvalidParameterException extends BaseException {
  /**
   * 创建无效参数异常。
   *
   * @param data 无效参数载荷。
   * @param status HTTP 状态码；默认 `400`。
   */
  constructor(data: InvalidParameterExceptionData, status = 400) {
    super(INVALID_PARAMETER, `Invalid parameter '${data.name}'!`, data, status);
  }
}

//#endregion
