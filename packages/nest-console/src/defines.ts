import { type NestLogger } from '@jshow/nest-common';

import { type INestApplication } from '@nestjs/common';

/** 通过 `ConsoleService.run` 运行装饰器命令时的选项。 */
export interface ConsoleRunOptions {
  /** 用于解析命令类实例的 Nest 应用。 */
  app: INestApplication;
  /** 传给 commander 的程序名。 */
  name: string;
  /** 传给 commander 的程序版本；`ConsoleService.run` 中有默认值。 */
  version?: string;
  /** 追加到命令方法参数末尾的 logger。 */
  logger?: NestLogger;
  /** commander 解析的原始 argv 列表。 */
  args?: string[];
  /** 命令执行完成或失败时调用的回调。 */
  callback?: (error?: Error) => void;
}
