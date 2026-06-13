# @jshow/nest-console

`@jshow/nest-console` 为 Nest 应用提供基于装饰器的命令行注册能力。命令类通过 `@Console` 标记，命令方法通过 `@Command`、`@Option`、`@Argument` 描述，再由 `ConsoleService` 扫描 Nest module metadata 并注册到 commander。

## 安装

```bash
pnpm add @jshow/nest-console
```

本包依赖 `@nestjs/common`、`@nestjs/core`、`reflect-metadata` 和 `@jshow/nest-common`。包入口会导入 `reflect-metadata`。

## 导出内容

| 导出 | 作用 |
| --- | --- |
| `ConsoleModule` | 提供 `ConsoleService` 和 `MetadataScanner`。 |
| `ConsoleService` | 扫描带 metadata 的命令类，并将命令注册到 commander。 |
| `Console` | 标记命令类，可设置命令名前缀。 |
| `Commands` | 将命令类列表挂到 Nest module metadata。 |
| `Command` | 标记类方法为命令。 |
| `Option` | 标记方法参数为 commander option。 |
| `Argument` | 标记方法参数为 commander positional argument。 |
| `ConsoleRunOptions` | `ConsoleService.run` 的运行参数。 |

## 使用示例

### 定义命令类

```ts
import { Command, Console, Option } from '@jshow/nest-console';

@Console('task')
export class TaskCommand {
  @Command('run', 'Run a task')
  async run(@Option('name', 'Task name', 'default') name: string) {
    return name;
  }
}
```

上面的命令会注册为 `task:run`，并提供 `--name <name>` option。

### 挂载到模块

```ts
import { Module } from '@nestjs/common';
import { Commands, ConsoleModule } from '@jshow/nest-console';

import { TaskCommand } from './task.command';

@Commands([TaskCommand])
@Module({
  imports: [ConsoleModule]
})
export class AppModule {}
```

`Commands` 只负责写入 module metadata；实际注册发生在 `ConsoleService.run` 扫描模块时。

### 运行命令

```ts
import { ConsoleService } from '@jshow/nest-console';

const service = app.get(ConsoleService);

await service.runP({
  app,
  name: 'app',
  version: '1.0.0',
  args: process.argv,
  logger: console
});
```

命令方法执行时，装饰器声明的参数会按 `parameterIndex` 排序注入，最后额外追加 logger 参数。

## 本包命令

从仓库根目录执行：

```bash
pnpm --filter @jshow/nest-console run build
pnpm --filter @jshow/nest-console run tsc
```

## 目录结构

```text
src/
  console.module.ts             # 导出 ConsoleService 的 Nest 模块
  console.service.ts            # commander 注册与命令执行
  decorators/
    command.decorator.ts        # Command、Option、Argument metadata
    console.decorator.ts        # Console 与 Commands metadata
  defines.ts                    # ConsoleRunOptions
```

## 维护提示

- 新增 decorator metadata 时同步检查 `ConsoleService.addCommand` 的读取逻辑。
- `Option` 和 `Argument` 会检查重复名称，并抛出 `DuplicatedDefinitionException`。
- 命令类是在运行时通过 `module.addInjectable` 加到 Nest module 中；调整注入流程前先验证 Nest 版本行为。
- 新增公共导出时同步更新 `src/index.ts` 或 `src/decorators/index.ts`。
