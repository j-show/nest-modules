import { isNodeEnvironment } from '@jshow/logger';

/** 当前 `NODE_ENV` 值；未设置时为空字符串。 */
export const NODE_ENV = process.env.NODE_ENV ?? '';

/** 当前运行时是否为 Node.js 环境（依据 `@jshow/logger` 判断）。 */
export const isNode = isNodeEnvironment();

/** 当前 `NODE_ENV` 是否为 `production`。 */
export const isProd = NODE_ENV === 'production';

/** 当前进程是否未处于生产模式。 */
export const isDebug = !isProd;

/** 当前 `NODE_ENV` 是否为 `test`。 */
export const isTest = NODE_ENV === 'test';
