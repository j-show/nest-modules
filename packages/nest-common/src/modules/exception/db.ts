import { BaseException, type ExceptionData } from './base';

//#region InvalidObjectId

/** 无效数据库对象标识符的错误码。 */
export const INVALID_DB_ID = 'INVALID_DB_ID';

/** 携带无效标识符值的载荷。 */
export interface InvalidObjectIdExceptionData extends ExceptionData {
  /** 无法转换为 object id 的值。 */
  value?: string;
}

/** 无效 object id 输入时的 HTTP 400 异常。 */
export class InvalidObjectIdException extends BaseException {
  /**
   * 创建无效 object id 异常。
   *
   * @param data 无效 id 载荷。
   * @param status HTTP 状态码；默认 `400`。
   */
  constructor(data: InvalidObjectIdExceptionData, status = 400) {
    super(
      INVALID_DB_ID,
      `Can not create ObjectId using '${data.value}'!`,
      data,
      status
    );
  }
}

//#endregion

//#region InvalidSchema

/** 无效 schema 或属性错误的前缀错误码。 */
export const INVALID_SCHEMA = 'INVALID_SCHEMA';

/** 描述无效 schema 及可选属性的载荷。 */
export interface InvalidSchemaExceptionData extends ExceptionData {
  /** 写入错误码与消息的 schema 名称。 */
  schema_name: string;
  /** 可选属性名，写入错误码与消息。 */
  property_name?: string;
  /** 可选原始校验错误。 */
  error?: Error;
}

/** 无效 schema 数据时的 HTTP 400 异常。 */
export class InvalidSchemaException extends BaseException {
  /**
   * 创建无效 schema 异常。
   *
   * @param data 无效 schema 载荷。
   * @param status HTTP 状态码；默认 `400`。
   */
  constructor(data: InvalidSchemaExceptionData, status = 400) {
    super(
      data.property_name
        ? `${INVALID_SCHEMA}.${data.schema_name}.${data.property_name}`
        : `${INVALID_SCHEMA}.${data.schema_name}`,
      ` Invalid schema '${data.schema_name}' & Invalid property '${data.property_name}'!`,
      data,
      status
    );
  }
}

//#endregion

//#region NotFoundById

/** 按 id 查找实体未找到的错误码。 */
export const NOT_FOUND_BY_ID = 'NOT_FOUND_BY_ID';

/** 标识按 id 查找无结果的实体。 */
export interface NotFoundByIdExceptionData extends ExceptionData {
  /** 用于生成消息的实体名称。 */
  entity: string;
  /** 查找失败使用的标识符。 */
  id: string;
}

/** 按 id 查找失败时的 HTTP 404 异常。 */
export class NotFoundByIdException extends BaseException {
  /**
   * 创建按 id 未找到异常。
   *
   * @param data 缺失实体载荷。
   * @param status HTTP 状态码；默认 `404`。
   */
  constructor(data: NotFoundByIdExceptionData, status = 404) {
    super(
      NOT_FOUND_BY_ID,
      `Can't find ${data.entity} by id '${data.id}'!`,
      data,
      status
    );
  }
}

//#endregion

//#region ArchivedById

/** 实体存在但已归档的错误码。 */
export const ARCHIVED_BY_ID = 'ARCHIVED_BY_ID';

/** 标识已归档实体的 id。 */
export interface ArchivedByIdExceptionData extends ExceptionData {
  /** 用于生成消息的实体名称。 */
  entity: string;
  /** 归档查找使用的标识符。 */
  id: string;
}

/** 按 id 命中已归档实体时的 HTTP 404 异常。 */
export class ArchivedByIdException extends BaseException {
  /**
   * 创建已归档异常。
   *
   * @param data 已归档实体载荷。
   * @param status HTTP 状态码；默认 `404`。
   */
  constructor(data: ArchivedByIdExceptionData, status = 404) {
    super(
      ARCHIVED_BY_ID,
      `Already archived ${data.entity} by id '${data.id}'!`,
      data,
      status
    );
  }
}

//#endregion

//#region InvalidData

/** 无效实体数据的错误码。 */
export const INVALID_DATA = 'INVALID_DATA';

/** 标识某实体 id 下的无效数据。 */
export interface InvalidDataExceptionData extends ExceptionData {
  /** 用于生成消息的实体名称。 */
  entity: string;
  /** 与无效数据关联的标识符。 */
  id: string;
  /** 可选详情消息，保留在载荷中。 */
  message?: string;
}

/** 无效实体数据时的 HTTP 404 异常。 */
export class InvalidDataException extends BaseException {
  /**
   * 创建无效数据异常。
   *
   * @param data 无效数据载荷。
   * @param status HTTP 状态码；默认 `404`。
   */
  constructor(data: InvalidDataExceptionData, status = 404) {
    super(
      INVALID_DATA,
      `Invalid Data in ${data.entity} by id '${data.id}'!`,
      data,
      status
    );
  }
}

//#endregion
