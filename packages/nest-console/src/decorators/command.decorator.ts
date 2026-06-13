import { DuplicatedDefinitionException } from '@jshow/nest-common';

/** 存储方法命令定义的 metadata 键。 */
export const META_COMMAND = 'nest-console:command';
/** 存储命令 option 定义的 metadata 键。 */
export const META_COMMAND_OPTIONS = 'nest-console:command:options';
/** 存储命令 positional argument 定义的 metadata 键。 */
export const META_COMMAND_ARGUMENTS = 'nest-console:command:arguments';

/** 挂载在 `Command` 装饰方法上的 metadata。 */
export interface CommandMetaInfo {
  /** 注册到 commander 的命令名。 */
  name: string;
  /** 可选命令描述，注册到 commander。 */
  description?: string;
  /** 可选命令别名，注册到 commander。 */
  alias?: string;
}

/**
 * 标记类方法为控制台命令。
 *
 * @param meta 命令 metadata。
 * @returns 写入命令 metadata 的方法装饰器。
 */
export function Command(meta: CommandMetaInfo) {
  return ((target: object, _, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(
      META_COMMAND,
      { ...meta },
      target.constructor,
      descriptor.value.name
    );

    return descriptor;
  }) as MethodDecorator;
}

/** 挂载在 `Option` 装饰参数上的 metadata。 */
export interface OptionMetaInfo {
  /** option 名，用于 `--<name> <name>`。 */
  name: string;
  /** 注册到 commander 的 option 描述。 */
  description: string;
  /** 传给 commander 的默认值。 */
  defaultValue?: string | boolean | string[];
  /** commander 是否将 option 注册为必填。 */
  required?: boolean;
  /** 接收解析后 option 值的方法参数索引。 */
  parameterIndex: number;
}

/**
 * 标记方法参数为具名 commander option。
 *
 * @param meta option metadata。
 * @returns 写入 option metadata 的参数装饰器。
 * @throws DuplicatedDefinitionException 同名 option 重复注册时。
 */
export function Option(meta: Omit<OptionMetaInfo, 'parameterIndex'>) {
  return ((
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    const data =
      Reflect.getMetadata(
        META_COMMAND_OPTIONS,
        target.constructor,
        propertyKey
      ) || [];

    if (
      data.length > 0 &&
      data.filter((o: OptionMetaInfo) => o.name === meta.name).length > 0
    ) {
      throw new DuplicatedDefinitionException({
        type: 'option',
        name: meta.name
      });
    }

    data.push({
      ...meta,
      parameterIndex
    });

    return Reflect.defineMetadata(
      META_COMMAND_OPTIONS,
      data,
      target.constructor,
      propertyKey
    );
  }) as ParameterDecorator;
}

/** 挂载在 `Argument` 装饰参数上的 metadata。 */
export interface ArgumentMetaInfo {
  /** positional argument 名称。 */
  name: string;
  /** positional argument 描述。 */
  description: string;
  /** 传给 commander 的默认值。 */
  defaultValue?: unknown;
  /** commander 是否渲染为必填参数。 */
  required?: boolean;
  /** 接收解析后 argument 值的方法参数索引。 */
  parameterIndex: number;
}

/**
 * 标记方法参数为 commander positional argument。
 *
 * @param meta argument metadata。
 * @returns 写入 argument metadata 的参数装饰器。
 * @throws DuplicatedDefinitionException 同名 argument 重复注册时。
 */
export function Argument(meta: Omit<ArgumentMetaInfo, 'parameterIndex'>) {
  return ((
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    const data =
      Reflect.getMetadata(
        META_COMMAND_ARGUMENTS,
        target.constructor,
        propertyKey
      ) || [];

    if (
      data.length > 0 &&
      data.filter((o: ArgumentMetaInfo) => o.name === meta.name).length > 0
    ) {
      throw new DuplicatedDefinitionException({
        type: 'argument',
        name: meta.name
      });
    }

    data.push({
      ...meta,
      parameterIndex
    });

    return Reflect.defineMetadata(
      META_COMMAND_ARGUMENTS,
      data,
      target.constructor,
      propertyKey
    );
  }) as ParameterDecorator;
}
