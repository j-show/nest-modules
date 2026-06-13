/* eslint-disable @typescript-eslint/no-explicit-any */

/** 参数列表未知的构造函数类型。 */
export type Constructor<T = unknown> = new (...args: unknown[]) => T;

/** 接受任意参数列表的构造函数类型。 */
export declare type AnyParamConstructor<T> = new (...args: any[]) => T;

/** 提取数组元素类型；非数组类型原样返回。 */
export type Unpacked<T> = T extends (infer U)[] ? U : T;

/** 对象类型中仅包含字符串的键。 */
export type StringKeyOf<T> = Extract<keyof T, string>;

/** 对象所有属性值的联合类型。 */
export type ValueOf<T> = T[keyof T];

/** 类数组对象值的联合类型，排除数组原型键。 */
export type ArrayValueOf<T> = ValueOf<Omit<T, keyof []>>;

/** 消费可迭代值时接受的可迭代或迭代器。 */
export type IteratorLike<T> = IterableIterator<T> | Iterable<T>;

/** 元素提取 helper 接受的可迭代或类数组形状。 */
export type IterableLike<T> = Iterable<T> | ArrayLike<T>;

/** 可迭代对象 yield 的元素类型。 */
export type IterableItem<T extends Iterable<unknown>> =
  T extends Iterable<infer U> ? U : never;

/** 字符串、可迭代、类数组或回退类型的元素类型。 */
export type ItemOf<T, R = never> = T extends string
  ? T
  : T extends IterableLike<infer U>
    ? U
    : R;

/** 单个值或值数组。 */
export type MaybeArray<T> = T | T[];

/** 值或该值的 Promise。 */
export type MaybePromise<T> = T | Promise<T>;
