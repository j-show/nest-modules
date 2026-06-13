import { ServerResponse } from 'node:http';

import { type FastifyListener } from './defines';

type HeaderVal = number | string | readonly string[];
type Header2D = [string, HeaderVal];

/** 将 Node 兼容的 header 元组数组应用到响应。 */
const set2dArray = (res: ServerResponse, headers: Header2D[]) => {
  for (const [key, value] of headers) {
    if (!key) continue;

    res.setHeader(key, value);
  }
};

/** 应用扁平 header 数组；Node 支持时保留重复 header 值。 */
const set1dArrayWithAppend = (res: ServerResponse, headers: string[]) => {
  for (let i = 0; i < headers.length; i += 2) {
    res.removeHeader(headers[i]);
  }

  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    if (!key) continue;

    res.appendHeader(key, headers[i + 1]);
  }
};

/** 应用扁平 header 数组，逐个替换 header 值。 */
const set1dArrayWithSet = (res: ServerResponse, headers: string[]) => {
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    if (!key) continue;

    res.setHeader(key, headers[i + 1]);
  }
};

const isAppendHeaderSupported =
  typeof ServerResponse.prototype.appendHeader === 'function';
const set1dArray = isAppendHeaderSupported
  ? set1dArrayWithAppend
  : set1dArrayWithSet;

const setHeadersFromArray = (res: ServerResponse, headers: unknown[]) => {
  if (headers.length && Array.isArray(headers[0])) {
    set2dArray(res, headers as Header2D[]);
    return;
  }

  if (headers.length % 2 !== 0) {
    throw new TypeError('headers array is malformed');
  }

  set1dArray(res, headers as string[]);
};

const setHeadersFromObject = (res: ServerResponse, headers: unknown) => {
  for (const [key, value] of Object.entries(
    headers as Record<string, HeaderVal>
  )) {
    if (!key) continue;

    res.setHeader(key, value);
  }
};

const getWriteHeadArguments = (
  self: ServerResponse,
  args: unknown[]
): unknown[] => {
  const length = args.length;
  const index = length > 1 && typeof args[1] === 'string' ? 2 : 1;
  const headers = length >= index + 1 ? args[index] : void 0;

  self.statusCode = args[0] as number;

  if (Array.isArray(headers)) {
    setHeadersFromArray(self, headers);
  } else if (headers) {
    setHeadersFromObject(self, headers);
  }

  const list = new Array(Math.min(length, index));
  for (let i = 0; i < list.length; i++) list[i] = args[i];

  return list;
};

function createWriteHead(
  preWriteHead: ServerResponse['writeHead'],
  listener: FastifyListener
): ServerResponse['writeHead'] {
  let fired = false;

  return function writeHead() {
    // @ts-ignore
    // eslint-disable-next-line no-invalid-this
    const self = this as ServerResponse;
    // eslint-disable-next-line prefer-rest-params
    let args: unknown[] = getWriteHeadArguments(self, Array.from(arguments));

    if (!fired) {
      fired = true;
      listener.call(self);

      if (typeof args[0] === 'number' && self.statusCode !== args[0]) {
        args = [self.statusCode];
      }
    }

    // @ts-ignore
    return preWriteHead.apply(self, args);
  };
}

/**
 * 安装一次性监听器，在 Fastify 响应写入 header 前触发。
 *
 * 机制与 [jshttp/on-headers](https://github.com/jshttp/on-headers) 等价。
 * Fastify 流式响应（`reply.send(stream)`）走 `setHeader` + `pipe` 路径时可能不触发。
 *
 * @param res 待 patch 的 Node 服务端响应。
 * @param listener 以响应对象为 `this` 调用的监听器。
 * @throws TypeError 当 `res` 缺失或 `listener` 不是函数时。
 */
export function useFastifyHeaders(
  res: ServerResponse,
  listener: FastifyListener
) {
  if (!res) {
    throw new TypeError('argument res is required');
  }

  if (typeof listener !== 'function') {
    throw new TypeError('argument listener must be a function');
  }

  res.writeHead = createWriteHead(res.writeHead, listener);
}
