# jshow nest modules

`@jshow/nest-modules` 是 `@jshow` 体系下的 Nest 相关 TypeScript 包工作区，包含通用异常/工具、命令行装饰器服务、日志工厂与传输实现。根包是私有 workspace，实际可发布包位于 `packages/*`。

## 环境要求

- Node.js `>=22`
- pnpm `>=11`
- TypeScript 5、Vite 8、ESLint 9

安装依赖：

```bash
pnpm install
```

## 包列表

| 包 | 作用 |
| --- | --- |
| `@jshow/nest-common` | 通用常量、异常类、Fastify adapter/header helpers、类型工具和通用 utils。 |
| `@jshow/nest-console` | 基于装饰器声明 console command，并通过 `ConsoleService` 注册到 commander。 |
| `@jshow/nest-logger` | 基于 `@jshow/logger` 的 logger factory、Nest middleware、console/file/logstash transport。 |

## 常用命令

```bash
pnpm run eslint .
pnpm run prettier
pnpm --filter @jshow/nest-common run tsc
pnpm --filter @jshow/nest-logger run tsc
pnpm --filter @jshow/nest-console run tsc
pnpm run build
```

其他脚本：

| 命令 | 作用 |
| --- | --- |
| `pnpm run clean` | 删除 `packages/**/dist`。 |
| `pnpm run build` | 按拓扑顺序构建全部 workspace 包。 |

发布、召回和 tag 发布脚本会触碰 npm、git tag 或远端状态，执行前先确认当前分支、版本和 registry。

## 使用示例

### Fastify adapter

```ts
import { createFastifyAdapter } from '@jshow/nest-common';

const adapter = createFastifyAdapter({});
```

### 自定义异常

```ts
import { InvalidParameterException } from '@jshow/nest-common';

throw new InvalidParameterException({ name: 'id', reason: 'must be numeric' });
```

### Console command

```ts
import { Command, Console, Option } from '@jshow/nest-console';

@Console('task')
export class TaskCommand {
  @Command('run', 'Run a task')
  run(@Option('name', 'Task name', 'default') name: string) {
    return name;
  }
}
```

### Logger config

```ts
import { getLoggerConfig, initNestLogger } from '@jshow/nest-logger';

initNestLogger(getLoggerConfig());
```

## 配置与环境变量

代码通过 `config` 包读取 logger 配置，并读取少量环境变量：

| 名称 | 作用 |
| --- | --- |
| `NODE_ENV` | 影响 `isProd`、`isDebug`、`isTest` 和部分日志格式。 |
| `LOGSTASH=on` | 强制启用 Logstash 输出。 |
| `LOGSTASH_CONTEXT_ID` | Logstash 事件使用的上下文 id；未设置时由客户端生成。 |
| `SENTRY_RELEASE` | Logstash 事件的 namespace，未设置时使用 `default`。 |
| `logger.format` | logger 输出格式，当前读取 `text` 或 `json`。 |
| `logger.persistence.file` | 文件日志输出目录。 |
| `logger.persistence.file.meta` | 大型 metadata 输出目录。 |
| `logger.timeFormat` | dayjs 时间格式；未配置时不输出时间戳。 |
| `logger.logstash.enable` | 非环境变量路径下的 Logstash 开关。 |
| `logger.logstash.host` / `logger.logstash.port` | Logstash 目标地址。 |

## 目录结构

```text
packages/
  nest-common/   # 共享异常、Fastify helper、类型与工具
  nest-console/  # 控制台装饰器、模块与服务
  nest-logger/   # logger factory、中间件与 transport
docs/agents/     # 面向 AI 编码代理的项目说明
```

## 当前维护提示

- 当前 package 使用 `dist/index.mjs`、`dist/index.cjs` 和 `dist/index.d.ts` 作为导出目标。
- 根目录 `pnpm exec tsc --noEmit -p tsconfig.json` 可能因 workspace 体量导致 OOM；优先使用各 package 的 `tsc` 脚本做类型检查。

## 代理文档

面向 AI 编码代理的项目约束见 [AGENTS.md](AGENTS.md)，细分说明见 [docs/agents/packages.md](docs/agents/packages.md) 和 [docs/agents/release-scripts.md](docs/agents/release-scripts.md)。
