# @jshow/nest-common

`@jshow/nest-common` 提供 Nest 项目中复用的通用能力：环境常量、HTTP 异常基类与业务异常、Fastify adapter/header helper、TypeScript 类型工具，以及配置、哈希、错误与对象处理工具。

## 安装

```bash
pnpm add @jshow/nest-common
```

本包依赖 `@jshow/logger`、`@nestjs/common`、`@nestjs/platform-fastify`、`config`、`dayjs`、`fastify`、`lodash-es` 和 `tslib`。

## 导出内容

包入口 `src/index.ts` 当前导出：

| 模块 | 内容 |
| --- | --- |
| `constants` | `NODE_ENV`、`isNode`、`isProd`、`isDebug`、`isTest`。 |
| `modules/exception` | `BaseException`、`ExceptionData` 及运行时、冲突、鉴权、参数、数据库相关异常类与错误码常量。 |
| `modules/fastify` | `createFastifyAdapter`、`FASTIFY_MAX_UPLOAD_BYTES`、`FastifyAdapterOptions`、`useFastifyHeaders`。 |
| `types` | `Nullable`、`Constructor`、`ValueOf`、`NestLogger` 等 TypeScript 工具类型。 |
| `utils` | `getConfig` / `hasConfig`、`MD5` / `UUID` / `safeShortenUUID`、`ensureError`、`stripUndefined`、`anyBase` 等工具。 |

### 异常一览

所有内置异常继承 `BaseException`，实例上保留 `code` 和 `data`，同时走 Nest `HttpException` 响应流程。

| 类别 | 代表符号 | 默认 HTTP 状态 |
| --- | --- | --- |
| 运行时 | `RuntimeException` | 500 |
| 冲突 | `ConflictException` | 409 |
| CLI 重复定义 | `DuplicatedDefinitionException` | 500 |
| 鉴权 | `AccessDeniedException`、`UnauthorizedException` | 403 / 401 |
| 参数 | `EmptyParameterException`、`InvalidParameterException` | 400 |
| 数据库 | `InvalidObjectIdException`、`InvalidSchemaException`、`NotFoundByIdException`、`ArchivedByIdException`、`InvalidDataException` | 400 / 404 |

各异常类均导出对应的错误码常量（如 `CONFLICT`、`INVALID_PARAMETER`）与 `*Data` 载荷类型，详见 `src/modules/exception/`。

## 使用示例

### Fastify adapter

```ts
import { createFastifyAdapter } from '@jshow/nest-common';

const adapter = createFastifyAdapter({});
```

`createFastifyAdapter` 创建 Nest `FastifyAdapter`，默认 body limit 为 `FASTIFY_MAX_UPLOAD_BYTES`（1 TiB），并为 `multipart/form-data` 注册透传 stream 的 content-type parser。

### 响应 header hook

```ts
import { useFastifyHeaders } from '@jshow/nest-common';

useFastifyHeaders(res, () => {
  // 在 writeHead 前执行，例如记录请求结束日志
});
```

`useFastifyHeaders` 通过 patch `ServerResponse.writeHead` 实现，与 [jshttp/on-headers](https://github.com/jshttp/on-headers) 机制等价。Fastify 对流式响应（`reply.send(stream)`）走 `setHeader` + `pipe` 路径，可能不触发该 hook；若需覆盖流式响应，应在 Fastify `onSend` 等 hook 中补充打点。`@jshow/nest-logger` 的请求 middleware 依赖此 helper。

### 自定义异常

```ts
import {
  ConflictException,
  InvalidParameterException,
  NotFoundByIdException
} from '@jshow/nest-common';

throw new InvalidParameterException({
  name: 'id',
  reason: 'must be numeric'
});

throw new ConflictException({
  entity: 'User',
  conditions: 'email'
});

throw new NotFoundByIdException({ entity: 'User', id: '507f1f77bcf86cd799439011' });
```

### 配置读取

```ts
import { getConfig, hasConfig } from '@jshow/nest-common';

const enabled = hasConfig('feature.enabled');
const mode = getConfig('feature.mode', 'default', value =>
  ['default', 'strict'].includes(String(value))
);
```

`getConfig` 从 `config` 包读取值；key 不存在或 `verify` 校验失败时返回默认值。

### 对象与错误工具

```ts
import { stripUndefined, ensureError, getObjectHash } from '@jshow/nest-common';

const payload = stripUndefined({ name: 'demo', desc: undefined });
const err = ensureError(caught, 'operation failed');
const hash = getObjectHash({ b: 2, a: 1 });
```

`stripValue` / `stripUndefined` 会移除对象属性；数组只会在 `deep=true` 时递归处理。`getObjectHash` 对对象顶层键值对排序后做 MD5，用于生成稳定哈希。

### 标识符与哈希

```ts
import { MD5, safeShortenUUID, safeShortenDate } from '@jshow/nest-common';

const digest = MD5('input');
const id = safeShortenUUID();
const dateToken = safeShortenDate();
```

`safeShortenUUID` / `safeShortenDate` 使用 URI 安全字符集压缩 UUID 与日期，适合作为短标识符。

## 配置与环境

| 名称 | 作用 |
| --- | --- |
| `NODE_ENV` | 用于派生 `isProd`、`isDebug`、`isTest`。 |
| `config` 包 | `getConfig` / `hasConfig` 的配置来源；需在应用侧按 [node-config](https://github.com/node-config/node-config) 约定提供配置文件。 |

## 本包命令

从仓库根目录执行：

```bash
pnpm --filter @jshow/nest-common run build
pnpm --filter @jshow/nest-common run tsc
```

## 目录结构

```text
src/
  constants/            # 运行时环境常量
  modules/
    exception/          # 自定义 Nest HTTP 异常
    fastify/            # Fastify adapter 与响应 header helper
  types/                # 共享 TypeScript 工具类型
  utils/                # 配置、哈希、错误、对象、字符串工具
```

## 维护提示

- 新增公共 API 时同步更新 `src/index.ts` 或对应子目录 `index.ts`。
- 新增跨包引用后运行 `pnpm run deps:check`，确保 `@jshow/*` 依赖显式声明。
- 不要把 `dist/` 当作源码修改；当前包通过 Vite 输出 `dist/index.mjs`、`dist/index.cjs` 和 `dist/index.d.ts`。
