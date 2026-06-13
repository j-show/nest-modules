import { jsonStringifySafe } from '@jshow/logger';
import { getConfig, safeShortenUUID } from '@jshow/nest-common';

import {
  type LogstashSendData,
  type LogstashTransport,
  LogstashTransportTCP,
  LogstashTransportUDP
} from './transport';

const CONFIG_KEY_LOGSTASH_ENABLE = 'logger.logstash.enable';
const CONFIG_KEY_LOGSTASH_HOST = 'logger.logstash.host';
const CONFIG_KEY_LOGSTASH_PORT = 'logger.logstash.port';

/**
 * 解析 Logstash 输出是否启用。
 *
 * @param key 当 `LOGSTASH` 环境变量非 `on` 时使用的配置键。
 * @returns `LOGSTASH=on` 或配置值为 `on` 时为 `true`。
 */
export const getEnabledLogstash = (key = CONFIG_KEY_LOGSTASH_ENABLE) => {
  if (process.env.LOGSTASH === 'on') return true;
  return getConfig(key) === 'on';
};

let client: Logstash;
const enableLogstashClient = getEnabledLogstash();
const logstashHost = enableLogstashClient
  ? getConfig(CONFIG_KEY_LOGSTASH_HOST)
  : void 0;
const logstashPort = enableLogstashClient
  ? getConfig<number>(CONFIG_KEY_LOGSTASH_PORT)
  : void 0;

/** 懒加载 Logstash 客户端，通过 TCP 或 UDP 发送结构化记录。 */
export class Logstash {
  /**
   * 启用时通过共享客户端发送一条日志记录。
   *
   * @param level 日志级别字符串。
   * @param message 日志消息或结构化载荷。
   * @returns transport 回调完成时 resolve 的 Promise。
   * @throws Error Logstash 已启用但缺少 host 或 port 配置时。
   */
  static async sendLog(
    level: string,
    message: string | Record<string, unknown>
  ) {
    if (!enableLogstashClient) return;

    if (!logstashHost || !logstashPort)
      throw new Error('Invalid logstash pipeline config');

    let instance = client;
    if (!instance) {
      client = new Logstash('tcp', logstashHost, logstashPort);
      instance = client;
      instance.connect();

      if (!process.env.LOGSTASH_CONTEXT_ID)
        process.env.LOGSTASH_CONTEXT_ID = client.id;
    }

    const sendObject: LogstashSendData = {
      '@timestamp': new Date(),
      message,
      level,
      contextId: process.env.LOGSTASH_CONTEXT_ID || instance.id,
      namespace: process.env.SENTRY_RELEASE || 'default'
    };

    await new Promise((resolve, reject) => {
      instance.send(sendObject, (err?: Error) => {
        if (err) return reject(err);
        resolve(true);
      });
    });
  }

  private readonly _id: string;
  private _transport?: LogstashTransport;

  constructor(
    public readonly type: 'tcp' | 'udp',
    public readonly host: string,
    public readonly port: number
  ) {
    this._id = safeShortenUUID();
  }

  /** 为本客户端实例生成的唯一上下文 id。 */
  public get id() {
    return this._id;
  }

  /** 与配置协议类型匹配的 transport 实例。 */
  public get transport() {
    if (this._transport?.type === this.type) return this._transport;

    switch (this.type) {
      case 'tcp':
        this._transport = new LogstashTransportTCP(this.host, this.port);
        break;
      case 'udp':
      default:
        this._transport = new LogstashTransportUDP(this.host, this.port);
        break;
    }

    return this._transport;
  }

  /** 连接底层 transport。 */
  public connect() {
    this.transport.connect();
  }

  /**
   * 通过底层 transport 发送结构化 Logstash 载荷。
   *
   * @param msg 待 JSON 序列化并发送的载荷。
   * @param cb 由 transport 调用的回调。
   */
  public send<T extends LogstashSendData>(msg: T, cb: () => void) {
    this.transport.send(jsonStringifySafe(msg), cb);
  }
}
