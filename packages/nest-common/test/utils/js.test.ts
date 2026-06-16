import { describe, expect, it } from 'vitest';

import {
  keysOf,
  pick,
  predicate,
  stripUndefined,
  stripValue
} from '../../src/utils/js';

describe('stripValue', () => {
  it('removes matching top-level properties from object', () => {
    expect(stripValue({ a: 1, b: null, c: 3 }, null)).toEqual({ a: 1, c: 3 });
  });

  it('returns arrays unchanged when deep is false', () => {
    expect(stripValue([null, 1], null)).toEqual([null, 1]);
  });

  it('recursively strips values when deep is true', () => {
    expect(stripValue({ a: { b: null, c: 1 } }, null, true)).toEqual({
      a: { c: 1 }
    });
  });

  it('returns primitives unchanged', () => {
    expect(stripValue('text', null)).toBe('text');
  });
});

describe('stripUndefined', () => {
  it('removes undefined properties', () => {
    expect(stripUndefined({ a: 1, b: void 0, c: 'x' })).toEqual({
      a: 1,
      c: 'x'
    });
  });
});

describe('predicate', () => {
  it('narrows truthy values', () => {
    const values = [0, '', false, null, void 0, 'ok', 1];
    expect(values.filter(predicate)).toEqual(['ok', 1]);
  });
});

describe('pick', () => {
  it('copies selected keys into a new object', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 });
  });
});

describe('keysOf', () => {
  it('returns typed object keys', () => {
    expect(keysOf({ foo: 1, bar: 2 }).sort()).toEqual(['bar', 'foo']);
  });
});
