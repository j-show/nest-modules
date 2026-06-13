/**
 * 本模块存放各种字符串转换相关函数
 */

import crypto from 'node:crypto';

import { default as dayjs } from 'dayjs';
import { chain } from 'lodash-es';

import { anyBase } from './any';

/**
 * 最保守的 URI 安全字
 * 为了防止任何可能出现的分词、分析等行为放弃了所有符号，为保证在大小写不敏感的平台上可以正常使用放弃了大写字符
 * 这样可以保证从这个模块压缩过的字符可以在最大可能性随时在任何场景下不作任何处理就可以作为 identity 使用
 */
const URISafeCharSet = '0123456789abcdefghijklmnopqrstuvwxyz';

// 16进制转 URI 安全字
const HEX2USC: (x: string) => string = anyBase('HEX', URISafeCharSet);
// 10进制转 URI 安全字
const DEC2USC: (x: string) => string = anyBase('DEC', URISafeCharSet);

/**
 * 计算字符串的小写 MD5 摘要。
 *
 * @param x 输入字符串。
 * @returns 小写十六进制 MD5 摘要。
 */
export const MD5 = (x: string) => {
  return crypto.createHash('md5').update(x).digest('hex') as Lowercase<string>;
};

/**
 * 生成小写随机 UUID。
 *
 * @returns 小写 UUID 字符串。
 */
export const UUID = () => {
  return crypto.randomUUID() as Lowercase<string>;
};

/**
 * 使用本模块保守字母表生成 URI 安全的短 UUID。
 *
 * @returns 短小写标识符。
 */
export const safeShortenUUID = (): string => {
  return HEX2USC(UUID().replace(/-/g, ''));
};

/**
 * 从当前日期生成 URI 安全的紧凑日期标识符。
 *
 * @returns 短小写日期 token。
 */
export const safeShortenDate = (): string => {
  return DEC2USC(dayjs().format('YYYYMMDD'));
};

/**
 * 对对象顶层键值对排序后计算 MD5 哈希。
 *
 * @param obj 待哈希对象。
 * @returns 对象顶层键值对的稳定小写哈希。
 */
export const getObjectHash = (obj: {}): string => {
  return chain(obj)
    .toPairs()
    .sortBy(pair => pair[0])
    .thru(ele => JSON.stringify(ele))
    .thru(ele => MD5(ele))
    .value();
};
