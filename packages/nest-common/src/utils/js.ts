import { type Nullable, type ValueOf } from '../types';

/**
 * 从对象中移除严格等于 `v` 的属性；数组仅在 deep 模式下处理。
 *
 * @param x 源值。
 * @param v 要从对象属性中移除的值。
 * @param deep 是否递归处理嵌套对象与数组。
 * @returns 移除匹配属性后的同形状值。
 */
export const stripValue = <T>(x: T, v: unknown, deep = false): T => {
  if (typeof x === 'object' && x) {
    if (Array.isArray(x)) {
      if (!deep) return x;
      return x.map(child => stripValue(child, v, deep)) as unknown as T;
    }

    const result = {} as T;
    for (const key of Object.keys(x) as Array<keyof typeof x>) {
      const value = x[key];
      if (value === v) continue;
      result[key] = deep ? stripValue(value, v, deep) : value;
    }
    return result;
  }
  return x;
};

/**
 * 从对象中移除 `undefined` 属性。
 *
 * @param x 源值。
 * @param deep 是否递归处理嵌套对象与数组。
 * @returns 移除 `undefined` 属性后的同形状值。
 */
export const stripUndefined = <T>(x: T, deep = false): T => {
  return stripValue(x, void 0, deep);
};

/**
 * 布尔类型守卫，排除 nullable 与常见 falsy 值。
 *
 * @param x 待测值。
 * @returns 值为 truthy 时为 `true`。
 */
export const predicate = <T>(
  x: T
): x is Exclude<T, Nullable | false | 0 | ''> => {
  return Boolean(x);
};

/**
 * 将选定键从对象复制到新对象。
 *
 * @param source 源对象。
 * @param keys 要复制的键。
 * @returns 仅包含选定键的新对象。
 */
export const pick = <T, K extends keyof T>(
  source: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key];
  }
  return result;
};

/**
 * 带类型的 `Object.keys` 包装。
 *
 * @param x 源对象。
 * @returns 类型为 `keyof T` 的键数组。
 */
export const keysOf = <T extends object>(x: T): Array<keyof T> => {
  return Object.keys(x) as Array<keyof T>;
};

/**
 * 迭代对象值（带类型）。
 *
 * @param x 源对象。
 * @returns 对象值的可迭代迭代器。
 */
export function* valuesOf<T extends object>(
  x: T
): IterableIterator<ValueOf<T>> {
  for (const key of keysOf(x)) {
    yield x[key];
  }
}
