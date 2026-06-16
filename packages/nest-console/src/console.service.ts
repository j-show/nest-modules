import { type Constructor, type NestLogger } from '@jshow/nest-common';

import { type INestApplication, Injectable } from '@nestjs/common';
import { type MetadataScanner, type ModulesContainer } from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { type Module } from '@nestjs/core/injector/module';

import { type Command, program } from 'commander';
import { get, sortBy } from 'lodash-es';

import {
  type ArgumentMetaInfo,
  type CommandMetaInfo,
  META_COMMAND,
  META_COMMAND_ARGUMENTS,
  META_COMMAND_OPTIONS,
  META_CONSOLE,
  META_MODULE_COMMANDS,
  type OptionMetaInfo
} from './decorators';
import { type ConsoleRunOptions } from './defines';

/** 扫描装饰器命令类并注册到 commander 的服务。 */
@Injectable()
export class ConsoleService {
  private readonly instanceLoader = new Injector();
  private callback?: ConsoleRunOptions['callback'];
  private logger?: NestLogger;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner
  ) {}

  /**
   * 注册模块声明的命令类并解析命令行参数。
   *
   * @param options 控制台运行时选项。
   */
  public run({
    app,
    name,
    version = 'v0.1.0',
    args = process.argv,
    logger = console,
    callback
  }: ConsoleRunOptions) {
    this.callback = callback;
    this.logger = logger;

    this.modulesContainer.forEach(module => {
      const commands = Reflect.getMetadata(
        META_MODULE_COMMANDS,
        module.metatype
      );
      if (!commands) return;

      commands.map((component: Constructor) => {
        // Nest 解析实例前，在运行时将命令类加入 module injectables。
        Injectable()(component);
        module.addInjectable(component, 'pipe');
        this.addCommand(app, program, component, module);
      });
    });

    program
      .allowUnknownOption(false)
      .enablePositionalOptions(false)
      .name(name)
      .version(version)
      .parseAsync(args)
      .catch((error: Error) => {
        if (this.callback) {
          this.callback(error);
        } else {
          throw error;
        }
      });
  }

  /**
   * `run` 的 Promise 包装；命令失败时 reject。
   *
   * @param options 不含 callback 的控制台运行时选项。
   * @returns 命令成功完成时 resolve 的 Promise。
   */
  public runP(options: Omit<ConsoleRunOptions, 'callback'>) {
    return new Promise<void>((resolve, reject) => {
      this.run(
        Object.assign(options, {
          callback: (error?: Error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          }
        })
      );
    });
  }

  /**
   * 将单个装饰器命令类注册到 commander program。
   *
   * @param app 用于解析命令实例的 Nest 应用。
   * @param prog 待修改的 commander program。
   * @param commandClass 装饰器标记的命令类。
   * @param module 拥有该命令类的 Nest 模块。
   * @returns 传入的 commander program。
   */
  public addCommand(
    app: INestApplication,
    prog: Command,
    commandClass: Constructor,
    module: Module
  ) {
    const consoleMeta = Reflect.getMetadata(META_CONSOLE, commandClass);
    if (!consoleMeta) return prog;

    const prefix = consoleMeta.prefix ? `${consoleMeta.prefix}:` : '';

    this.metadataScanner
      .getAllMethodNames(commandClass.prototype)
      .forEach(method => {
        const commandMeta: CommandMetaInfo = Reflect.getMetadata(
          META_COMMAND,
          commandClass,
          method
        );
        if (!commandMeta) return;

        const command = prog
          .command(`${prefix}${commandMeta.name}`)
          .description(commandMeta.description ?? '');

        if (commandMeta.alias) {
          command.alias(commandMeta.alias);
        }

        const argsInfo: Array<{ path: string[]; parameterIndex: number }> = [];

        const argumentsMeta: ArgumentMetaInfo[] =
          Reflect.getMetadata(META_COMMAND_ARGUMENTS, commandClass, method) ||
          [];
        for (const argumentMeta of sortBy(argumentsMeta, 'parameterIndex')) {
          argsInfo.push({
            path: ['args', argumentMeta.name],
            parameterIndex: argumentMeta.parameterIndex
          });

          command.arguments(
            argumentMeta.required
              ? `<${argumentMeta.name}>`
              : `[${argumentMeta.name}]`
          );
        }

        const optionsMeta: OptionMetaInfo[] =
          Reflect.getMetadata(META_COMMAND_OPTIONS, commandClass, method) || [];
        for (const optionMeta of sortBy(optionsMeta, 'parameterIndex')) {
          argsInfo.push({
            path: ['options', optionMeta.name],
            parameterIndex: optionMeta.parameterIndex
          });

          const optionSetter = optionMeta.required
            ? 'requiredOption'
            : 'option';

          command[optionSetter](
            `--${optionMeta.name} <${optionMeta.name}>`,
            optionMeta.description,
            optionMeta.defaultValue
          );
        }

        /**
         * parsedArgs: [...args, options, command]
         * 命令处理函数的参数为声明的所有参数，末尾还会附加 logger。
         */
        command.action(async (...inputs: unknown[]) => {
          const args: Record<string, string> = {};
          const options = inputs[inputs.length - 2] as Record<string, string>;

          if (inputs.length > 2) {
            for (const argumentMeta of sortBy(
              argumentsMeta,
              'parameterIndex'
            )) {
              args[argumentMeta.name] = inputs.shift() as string;
            }
          }

          try {
            const injectable = module.injectables.get(commandClass.name);
            if (!injectable) {
              throw new Error(`Can not get injectable: ${commandClass.name}`);
            }

            // 从 Nest 取实例前先加载运行时加入的 injectable。
            this.instanceLoader.loadPrototype(injectable, module.injectables);
            await this.instanceLoader.loadInjectable(injectable, module);

            const commandInstance = app.get(commandClass) as Record<
              string,
              (...args: unknown[]) => Promise<void>
            >;
            const methodArgs = [];
            const params = { args, options };

            for (const argInfo of sortBy(argsInfo, 'parameterIndex')) {
              methodArgs.push(get(params, argInfo.path));
            }
            methodArgs.push(this.logger);

            // eslint-disable-next-line prefer-spread
            await commandInstance[method].apply(commandInstance, methodArgs);

            this.callback?.();
          } catch (e) {
            if (this.callback) {
              this.callback(e as Error);
            } else {
              throw e;
            }
          }
        });
      });

    return prog;
  }
}
