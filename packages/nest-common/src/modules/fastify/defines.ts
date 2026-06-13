/** Fastify adapter 默认 body limit：1 TiB。 */
export const FASTIFY_MAX_UPLOAD_BYTES = 1024 * 1024 * 1024 * 1024;

/** Fastify 响应 hook 触发时的回调。 */
export type FastifyListener = () => void;

/** 可挂载到 Fastify adapter 实例的可选生命周期 hook。 */
export interface FastifyHooks {
  /** 响应 header 写入前触发的监听器。 */
  onSend?: FastifyListener;
}

/** 创建共享 Nest Fastify adapter 时使用的选项。 */
export interface FastifyAdapterOptions {
  /** 请求体最大字节数。 */
  bodyLimit?: number;
  /** 挂载到底层 Fastify 实例的可选 hook。 */
  hooks?: FastifyHooks;
}
