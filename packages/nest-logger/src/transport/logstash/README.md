# Logstash Transport

将 `@jshow/logger` 的日志记录转发到 Logstash 的传输层实现。目录内分为三层：

1. **传输协议**（`transport.ts`）— TCP/UDP socket、断线重连、发送队列
2. **应用客户端**（`client.ts`）— 读取配置、维护单例、组装结构化 payload
3. **Logger 适配**（`index.ts`）— 把 `LoggerContext` 格式化为 JSON 或文本后调用客户端

在 `LoggerFactory`（`src/core.ts`）中，仅当 Logstash 已开启且 `logger.format` 为 `json` 时才会调用 `logstashTransport`。

## 上游来源

`transport.ts` 中的核心传输逻辑 fork 自 [safe-logstash-client](https://github.com/Mehdikarimian/safe-logstash-client)，包括：

- `LogstashTransport` 抽象基类（消息队列、`maxSize` 裁剪、`dequeue` 刷新）
- `LogstashTransportTCP`（连接、`end`/`timeout` 断线后 5 秒重连、换行分隔写入）
- `LogstashTransportUDP`（`udp4` datagram 发送）

本仓库在 fork 基础上做了 TypeScript 化、类型补充，以及 `@jshow/logger` / `@jshow/nest-common` 的集成；`client.ts` 与 `index.ts` 为项目侧封装，不在上游包内。

## 文件说明

### `transport.ts`

底层 socket 传输实现，不依赖 Nest 或项目配置。

| 导出 | 作用 |
| --- | --- |
| `LogstashSendData` | 发往 Logstash 的结构化字段：`@timestamp`、`message`、`level`、`contextId`、`namespace` |
| `LogstashQueueData` | 队列项：序列化后的 `message` 字符串与发送完成 `callback` |
| `LogstashTransport` | 抽象基类。未连接时入队，连接后 `dequeue` 批量发送；支持可配置 `maxSize`（`-1` 表示不限制） |
| `LogstashTransportTCP` | TCP 客户端。`connect` 成功后刷新队列；`end` / `timeout` 触发 5 秒后自动重连；每条消息以 `\n` 结尾 |
| `LogstashTransportUDP` | UDP 客户端。创建 `udp4` socket 后直接 `send` datagram |

调试日志使用 `debug` 包，命名空间为 `logstash:transport`。

### `client.ts`

面向应用的 Logstash 客户端，负责配置解析与 payload 组装。

| 导出 | 作用 |
| --- | --- |
| `getEnabledLogstash(key?)` | 判断是否启用 Logstash：`LOGSTASH=on` 或配置项 `logger.logstash.enable === 'on'` |
| `Logstash` | 懒加载单例客户端。默认使用 TCP；`send` 经 `jsonStringifySafe` 序列化后交给底层 transport |
| `Logstash.sendLog(level, message)` | 静态入口：启用时发送一条记录；缺少 host/port 时抛出 `Invalid logstash pipeline config` |

**配置项**（通过 `@jshow/nest-common` 的 `getConfig` 读取）：

| 键 | 作用 |
| --- | --- |
| `logger.logstash.enable` | 开关（可被 `LOGSTASH=on` 覆盖） |
| `logger.logstash.host` | 目标主机 |
| `logger.logstash.port` | 目标端口 |

**环境变量**：

| 变量 | 作用 |
| --- | --- |
| `LOGSTASH=on` | 强制开启 Logstash |
| `LOGSTASH_CONTEXT_ID` | 进程级上下文 id；未设置时由客户端 `id` 写入 |
| `SENTRY_RELEASE` | 作为 payload 的 `namespace`；默认 `default` |

发送的 JSON 结构示例：

```json
{
  "@timestamp": "2026-06-10T12:00:00.000Z",
  "message": "...",
  "level": "info",
  "contextId": "abc123",
  "namespace": "my-release"
}
```

### `index.ts`

`@jshow/logger` transport 回调，桥接 logger 上下文与 `Logstash.sendLog`。

| 导出 | 作用 |
| --- | --- |
| `logstashTransport` | 接收 `level`、`context`、`messages`、`getTimestamp`，按 format 组装内容并异步发送 |
| `getEnabledLogstash` | 再导出自 `client.ts`，供 `core.ts` 判断是否在 factory 中挂载本 transport |

**`json` 格式**：将 `level`、context（去掉 `config`）、序列化后的 `messages` 与时间戳合并为一条 JSON 字符串，作为 `message` 字段发送。

**`text` 格式**：按 console transport 相同顺序拼接时间戳、namespace、`tags`、`extra` 与消息正文，以纯文本作为 `message` 发送。注意：`LoggerFactory` 仅在 `format === 'json'` 时调用本模块，`text` 分支保留以便直接调用或后续扩展。

发送均在 `process.nextTick` 中异步执行，避免阻塞 logger 的 `print` 路径。

## 调用关系

```text
LoggerFactory.print(...)
        │
        └─► logstashTransport()          [index.ts]
                │
                └─► Logstash.sendLog()   [client.ts]
                        │
                        └─► LogstashTransportTCP.send()
                                │        [transport.ts]
                                └─► net.Socket.write(...)
```

## 与 amazon-mono 的差异

历史实现通过 npm 包 `safe-logstash-client` 引入传输层；`@jshow/nest-logger` 将传输代码内联到 `transport.ts`，由 `client.ts` 直接实例化 `LogstashTransportTCP`，不再依赖外部包。配置键由 `logger.directToLogstash` 调整为 `logger.logstash.enable`，环境变量由 `LOG_DIRECT_TO_LOGSTASH` 调整为 `LOGSTASH`。
