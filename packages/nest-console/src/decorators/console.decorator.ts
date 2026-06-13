import { type Constructor } from '@jshow/nest-common';

/** 存储命令类前缀的 metadata 键。 */
export const META_CONSOLE = 'nest-console:console';
/** 存储挂载到 Nest 模块的命令类的 metadata 键。 */
export const META_MODULE_COMMANDS = 'nest-console:module:commands';

/**
 * 标记类为控制台命令容器。
 *
 * @param prefix 可选命令名前缀，由 `ConsoleService` 拼接。
 * @returns 写入 console metadata 的类装饰器。
 */
export function Console(prefix?: string): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(META_CONSOLE, { prefix }, target);
  };
}

/**
 * 将命令类挂载到 Nest 模块。
 *
 * @param commandClasses 由 `ConsoleService.run` 扫描的命令类列表。
 * @returns 写入模块命令 metadata 的类装饰器。
 */
export function Commands(commandClasses: Array<Constructor>) {
  return (target: Constructor) => {
    Reflect.defineMetadata(META_MODULE_COMMANDS, commandClasses, target);
  };
}
