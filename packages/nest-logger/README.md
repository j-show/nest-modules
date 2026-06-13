# @jshow/nest-logger

`@jshow/nest-logger` 基于 `@jshow/logger` 提供 Nest 日志能力：logger 初始化、请求日志 middleware，以及 console / file / Logstash 分发与格式化工具。

## 安装

```bash
pnpm add @jshow/nest-logger
```

本包依赖 `@jshow/logger`、`@jshow/nest-common`、`@nestjs/common`、`chalk`、`dayjs`、`debug`、`lodash-es`、`prettyjson` 和 `strip-ansi`。

## 导出内容

包入口 `src/index.ts` 当前导出：

| 导出 | 作用 |
| --- | --- |
| `initNestLogger` | 向 `@jshow/logger` 注册 core factory、proxy 与配置，应用启动时调用一次。 |
| `getLoggerConfig` | 从配置读取 logger format，并生成传给 `configure` 的 config。 |
| `ApiLoggerMiddleware` | 记录普通 API 请求的开始、结束、状态码和耗时。 |
| `OAuthLoggerMiddleware` | 使用固定 `OAUTH` 标签记录请求。 |
| `ErrorMeta` / `ErrorLiked` | 错误日志元数据与类 Error 对象的类型定义。 |
| `coloredLogText` | 基于 `chalk` 的终端着色工具（middleware 日志前缀使用）。 |
| `smartMeta` | 渲染 metadata；超长内容写入文件并返回文件引用。 |
| `createLogTimestamp` / `extractMessage` | 日志时间戳与 metadata / 错误文本格式化工具。 |

Transport 实现位于 `src/transport/`，由 `initNestLogger` 内部挂载，不作为包入口公开导出。Logstash 细节见 [`src/transport/logstash/README.md`](src/transport/logstash/README.md)。

## 使用示例

### 初始化 logger

在应用启动阶段（如 `main.ts`）调用 `initNestLogger`，之后通过 `@jshow/logger` 的 `useLogger` 写日志：

```ts
import { useLogger } from '@jshow/logger';
import { initNestLogger } from '@jshow/nest-logger';

initNestLogger();

useLogger('App').info('ready');
```

也可传入局部配置覆盖默认值：

```ts
import { initNestLogger, getLoggerConfig } from '@jshow/nest-logger';

initNestLogger({
  ...getLoggerConfig(),
  format: 'json'
});
```

`initNestLogger` 注册的 core factory 会读取 logger format、文件日志目录和 Logstash 开关：打印时总是写 console；配置了文件目录时写文件；Logstash 开启且 `format` 为 `json` 时发送 Logstash。

### Nest middleware

适用于 Nest + Fastify：中间件收到的是 Node 原生 `http.ServerResponse`，`END` 日志通过 `@jshow/nest-common` 的 `useFastifyHeaders` 在响应写 header 前触发。

```ts
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ApiLoggerMiddleware } from '@jshow/nest-logger';

@Module({})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
```

`ApiLoggerMiddleware` 在请求开始时写入 `BEGIN` 日志，并在响应写 header 前记录 `END`、状态码和耗时。`OAuthLoggerMiddleware` 用法相同，仅将方法列固定为 `OAUTH`。

**注意**：`useFastifyHeaders` 通过 patch `ServerResponse.writeHead` 实现。Fastify 对流式响应（`reply.send(stream)`）走 `setHeader` + `pipe` 路径，可能不触发 `END` 日志；若需覆盖流式响应，应在 Fastify `onSend` 等 hook 中补充打点。

## 配置与环境变量

| 名称 | 作用 |
| --- | --- |
| `logger.format` | logger 输出格式；当前读取 `text` 或 `json`，默认 `text`。 |
| `logger.persistence.file` | 文件日志目录；配置后会注册文件 flush timer。 |
| `logger.persistence.file.meta` | 大型 metadata 输出目录（`smartMeta` 使用）。 |
| `logger.timeFormat` | dayjs 时间格式；未配置时不输出时间戳。 |
| `logger.logstash.enable` | 非环境变量路径下的 Logstash 开关。 |
| `logger.logstash.host` / `logger.logstash.port` | Logstash 目标地址。 |
| `LOGSTASH=on` | 强制开启 Logstash。 |
| `LOGSTASH_CONTEXT_ID` | Logstash 上下文 id；未设置时由客户端生成。 |
| `SENTRY_RELEASE` | Logstash namespace；未设置时使用 `default`。 |

Logstash 仅在 `format === 'json'` 且开关开启时由 logger factory 自动发送；缺少 host 或 port 会在发送时抛出 `Invalid logstash pipeline config`。

## 本包命令

从仓库根目录执行：

```bash
pnpm --filter @jshow/nest-logger run build
pnpm --filter @jshow/nest-logger run tsc
```

## 目录结构

```text
src/
  core.ts                       # initNestLogger、getLoggerConfig、core factory
  middleware.ts                 # ApiLoggerMiddleware、OAuthLoggerMiddleware
  types.ts                      # ErrorMeta、ErrorLiked
  transport/
    console.ts                  # console transport
    file.ts                     # 缓冲文件 transport
    logstash/                   # Logstash 客户端与 TCP/UDP transport
  utils/format.ts               # metadata、时间戳与着色 helper
```

## 当前维护提示

- `console.ts` 使用动态 `console[level]`，当前 ESLint 会触发 `no-console` 规则。
- 文件日志使用模块级共享队列；`registerFileTimer` 对同一目录只注册一次定时器。
- 请求 middleware 依赖 `@jshow/nest-common` 的 `useFastifyHeaders`；与 [jshttp/on-headers](https://github.com/jshttp/on-headers) 机制等价，见 `packages/nest-common/src/modules/fastify/header.ts`。
