import { describe, expect, it } from 'vitest';

import { getObjectHash, MD5 } from '../../src/utils/crypt';

describe('MD5', () => {
  it('returns lowercase hex digest', () => {
    expect(MD5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
  });
});

describe('getObjectHash', () => {
  it('returns stable hash regardless of key insertion order', () => {
    const hashA = getObjectHash({ b: 2, a: 1 });
    const hashB = getObjectHash({ a: 1, b: 2 });
    expect(hashA).toBe(hashB);
    expect(hashA).toMatch(/^[0-9a-f]{32}$/);
  });
});
