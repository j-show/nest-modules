import { HttpException } from '@nestjs/common';

/** 无更具体错误码时使用的默认错误码。 */
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';

//#region Base

/** 自定义 Nest HTTP 异常携带的任意结构化载荷。 */
export interface ExceptionData {
  [key: string]: unknown;
}

/** 暴露机器可读 `code` 与 `data` 载荷的 `HttpException` 基类。 */
export class BaseException extends HttpException {
  /** 机器可读的应用错误码。 */
  public readonly code: string;
  /** 与异常关联的结构化载荷。 */
  public readonly data: ExceptionData;

  /**
   * 创建自定义 Nest HTTP 异常。
   *
   * @param code 机器可读的应用错误码。
   * @param message 传给 Nest `HttpException` 的响应体或消息。
   * @param data 保存在异常实例上的结构化载荷。
   * @param status 传给 Nest `HttpException` 的 HTTP 状态码。
   */
  constructor(
    code: string,
    message: string | object,
    data: ExceptionData,
    status: number
  ) {
    super(message, status);

    this.code = code;
    this.data = data;
  }
}

//#endregion

//#region Runtime

/** 运行时失败的错误码。 */
export const RUNTIME = 'RUNTIME';

/** 可配置 HTTP 状态码的运行时失败异常。 */
export class RuntimeException extends BaseException {
  /**
   * 创建运行时异常。
   *
   * @param message 返回给客户端的错误消息。
   * @param status HTTP 状态码；默认 `500`。
   * @param data 保存在异常实例上的结构化载荷。
   */
  constructor(message: string, status = 500, data: ExceptionData = {}) {
    super(RUNTIME, message, data, status);
  }
}

//#endregion

//#region Conflict

/** 冲突类失败的错误码。 */
export const CONFLICT = 'CONFLICT';

/** 描述冲突实体与条件的载荷。 */
export interface ConflictExceptionData extends ExceptionData {
  /** 发生冲突的实体名称。 */
  entity: string;
  /** 可选条件文本，会写入生成的消息。 */
  conditions?: string;
}

/** 资源重复或已被占用时的 HTTP 409 冲突异常。 */
export class ConflictException extends BaseException {
  /**
   * 创建冲突异常。
   *
   * @param data 冲突载荷、直接消息，或空值以使用默认错误码消息。
   * @param status HTTP 状态码；默认 `409`。
   */
  constructor(data?: ConflictExceptionData | string, status = 409) {
    if (!data) {
      super(CONFLICT, CONFLICT, {}, status);
      return;
    }

    if (typeof data === 'string') {
      super(CONFLICT, data, {}, status);
      return;
    }

    const conditions = data.conditions ?? 'given conditions';
    super(
      CONFLICT,
      `${data.entity} with ${conditions} has been taken`,
      data,
      status
    );
  }
}

//#endregion

//#region DuplicatedDefinition

/** CLI 选项或参数重复定义的错误码。 */
export const DUPLICATED_DEFINITION = 'DUPLICATED_DEFINITION';

/** 描述重复 CLI 选项或参数定义的载荷。 */
export interface DuplicatedDefinitionExceptionData<
  T = 'option' | 'argument'
> extends ExceptionData {
  /** 重复的 metadata 名称。 */
  name: string;
  /** 重复的 metadata 类别。 */
  type: T;
}

/** 控制台命令重复定义同名 option 或 argument 时抛出的异常。 */
export class DuplicatedDefinitionException extends BaseException {
  /**
   * 创建重复定义异常。
   *
   * @param data 重复定义载荷。
   * @param status HTTP 状态码；默认 `500`。
   */
  constructor(data: DuplicatedDefinitionExceptionData, status = 500) {
    super(
      DUPLICATED_DEFINITION,
      `Duplicated ${data.type} definition by name: ${data.name}`,
      data,
      status
    );
  }
}

//#endregion
