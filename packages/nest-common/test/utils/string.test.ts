import { afterEach, describe, expect, it, vi } from 'vitest';

import { randomString } from '../../src/utils/string';

describe('randomString', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses first character when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomString(3, 'abc')).toBe('aaa');
  });

  it('returns empty string when length is 0', () => {
    expect(randomString(0)).toBe('');
  });
});
