import { describe, expect, it } from 'vitest';

import { anyBase } from '../../src/utils/any';

describe('anyBase', () => {
  const uriSafe = '0123456789abcdefghijklmnopqrstuvwxyz';

  it('converts decimal digits to uri-safe alphabet', () => {
    const decToUri = anyBase('DEC', uriSafe);
    expect(decToUri('9')).toBe('9');
    expect(decToUri('10')).toBe('a');
  });

  it('returns input when source and destination alphabets match', () => {
    const dec = anyBase('DEC', '0123456789');
    expect(dec('42')).toBe('42');
  });

  it('throws when input contains characters outside source alphabet', () => {
    const hexToDec = anyBase('HEX', '0123456789');
    expect(() => hexToDec('zz')).toThrow(/non-alphabetic digits/);
  });

  it('throws when destination alphabet is empty', () => {
    expect(() => anyBase('DEC', '')).toThrow('Bad alphabet');
  });
});
