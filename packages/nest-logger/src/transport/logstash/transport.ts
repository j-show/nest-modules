import dgram from 'node:dgram';
import net from 'node:net';

import makeLogger from 'debug';

/** 发往 Logstash 的结构化载荷。 */
export interface LogstashSendData {
  /** 事件时间戳。 */
  '@timestamp': Date;
  /** 消息文本或结构化消息对象。 */
  message: string | Record<string, unknown>;
  /** 日志级别字符串。 */
  level: string;
  /** 当前进程共享的上下文 id。 */
  contextId: string;
  /** 随事件发送的 namespace。 */
  namespace: string;
}

/** 队列中的序列化日志消息及其完成回调。 */
export interface LogstashQueueData {
  /** 序列化后的日志消息。 */
  message: string;
  /** socket 发送完成后调用的回调。 */
  callback: () => void;
}

/** 在 concrete socket 连接前将 Logstash 消息入队的传输基类。 */
export abstract class LogstashTransport {
  private _maxSize = -1;
  protected debug = makeLogger('logstash:transport');
  protected queue: LogstashQueueData[] = [];

  constructor(public readonly type: string) {}

  /** concrete transport 是否已连接或正在连接。 */
  public abstract get connected(): boolean;

  /** 最大队列长度；`-1` 表示无界。 */
  public get maxSize(): number {
    return this._maxSize;
  }

  /** 设置最大队列长度；缩小时裁剪旧消息。 */
  public set maxSize(value: number) {
    const _value = Math.floor(value);
    if (_value < 1) {
      this._maxSize = -1;
      return;
    }

    if (_value < this._maxSize)
      this.queue = this.queue.slice(Math.max(this.queue.length - _value, 0));

    this._maxSize = _value;
  }

  protected abstract connectSocket(): void;
  protected abstract closeSocket(): void;
  protected abstract sendData(data: LogstashQueueData): void;

  /** 通过已连接的 concrete transport 刷新全部队列消息。 */
  protected dequeue() {
    this.debug(`dequeuing ${this.queue.length} messages`);

    while (this.queue.length) {
      const data = this.queue.shift();
      if (!data) continue;

      this.sendData(data);
    }
  }

  /**
   * 已连接时立即发送，否则入队。
   *
   * @param message 序列化后的日志消息。
   * @param callback 由 concrete transport 调用的回调。
   */
  public send(message: string, callback: () => void): void {
    if (this.connected) {
      this.debug(`sending message [${message}]`);
      return this.sendData({ message, callback });
    }

    this.debug('queueing message');
    this.queue.push({ message, callback });

    if (this.maxSize > 0) {
      while (this.queue.length > this.maxSize) this.queue.shift();
    }
  }

  /** 重连 concrete socket，已有连接时先关闭。 */
  public connect(): void {
    if (this.connected) this.closeSocket();
    this.connectSocket();
  }

  /** 已连接时关闭 concrete socket。 */
  public close(): void {
    if (!this.connected) return;
    this.closeSocket();
  }
}

/** TCP Logstash transport，对 `end` 与 `timeout` 事件处理断线重连。 */
export class LogstashTransportTCP extends LogstashTransport {
  protected socket: net.Socket | null = null;
  protected isConnected = false;

  constructor(
    public readonly host: string,
    public readonly port: number
  ) {
    super('tcp');
    this.debug('new instance of TCP');
  }

  /** TCP socket 是否正在连接或已标记为 connected。 */
  public get connected() {
    return !!(this.socket?.connecting || this.isConnected);
  }

  /** 打开 TCP socket，连接成功后刷新队列。 */
  protected connectSocket() {
    this.socket = net.createConnection(
      {
        host: this.host,
        port: this.port
      },
      () => {
        this.isConnected = true;
        this.debug('tcp connected');
        this.dequeue();
      }
    );

    const handleClose = () => {
      this.isConnected = false;
      this.socket = null;
      this.debug('tcp disconnect');
    };

    this.socket.on('close', handleClose);

    this.socket.on('end', () => {
      handleClose();
      this.reconnectSocket();
    });

    this.socket.on('timeout', () => {
      this.socket?.end();
      this.reconnectSocket();
    });
  }

  /** 断线 5 秒后调度 TCP 重连。 */
  protected reconnectSocket() {
    setTimeout(() => {
      this.connectSocket();
    }, 1000 * 5);
  }

  /** 若 socket 存在则结束 TCP 连接。 */
  protected closeSocket() {
    if (this.socket == null) return;
    this.socket.end();
  }

  /** 向 TCP socket 写入一条以换行结尾的消息。 */
  protected sendData(data: LogstashQueueData) {
    this.socket?.write(`${data.message}\n`, data.callback);
  }
}

/** UDP Logstash transport，每条序列化消息作为一个 datagram 发送。 */
export class LogstashTransportUDP extends LogstashTransport {
  protected socket: dgram.Socket | null = null;
  protected isConnected = false;

  constructor(
    public readonly host: string,
    public readonly port: number
  ) {
    super('udp');
    this.debug('new instance of UDP');
  }

  /** UDP socket 是否已创建。 */
  public get connected() {
    return this.isConnected;
  }

  /** 创建 UDP socket。 */
  protected connectSocket() {
    this.socket = dgram.createSocket('udp4');
    this.isConnected = true;
  }

  /** 关闭并清除 UDP socket。 */
  protected closeSocket() {
    if (this.socket == null) return;
    this.isConnected = false;
    this.socket.close();
    this.socket = null;
  }

  /** 向配置的 UDP host/port 发送一条消息 buffer。 */
  protected sendData(data: LogstashQueueData) {
    const buffer = Buffer.from(data.message);
    this.socket?.send(
      buffer,
      0,
      buffer.length,
      this.port,
      this.host,
      data.callback
    );
  }
}
