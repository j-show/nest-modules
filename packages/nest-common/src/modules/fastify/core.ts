import { FastifyAdapter } from '@nestjs/platform-fastify';

import { type FastifyInstance } from 'fastify';

import {
  FASTIFY_MAX_UPLOAD_BYTES,
  type FastifyAdapterOptions
} from './defines';

const initFastifyInstance = (
  fastify: FastifyInstance,
  _?: FastifyAdapterOptions['hooks']
) => {
  // multipart 载荷保持为 stream，由下游 handler 自行解析。
  fastify.addContentTypeParser(
    /^multipart\/form-data($|;)/i,
    (
      _request: unknown,
      payload: NodeJS.ReadableStream,
      done: (error: Error | null, body?: unknown) => void
    ) => {
      done(null, payload);
    }
  );
};

/**
 * 创建带本仓库 multipart 解析器与 body limit 的 Nest Fastify adapter。
 *
 * @param options Fastify adapter 选项。
 * @returns 配置完成的 Nest `FastifyAdapter`。
 */
export const createFastifyAdapter = ({
  bodyLimit = FASTIFY_MAX_UPLOAD_BYTES,
  hooks
}: FastifyAdapterOptions): FastifyAdapter => {
  const adapter = new FastifyAdapter({ bodyLimit });
  const fastify = adapter.getInstance() as FastifyInstance;

  initFastifyInstance(fastify, hooks);

  return adapter;
};
