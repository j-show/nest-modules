import { describe, expect, it } from 'vitest';

import { ensureError, ensureErrorMessage } from '../../src/utils/error';

describe('ensureError', () => {
  it('wraps string message in Error', () => {
    const error = ensureError('boom');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
  });

  it('prepends headMessage to string message', () => {
    const error = ensureError('boom', 'context');
    expect(error.message).toBe('context;  boom');
  });

  it('returns same Error instance and prepends headMessage', () => {
    const original = new Error('inner');
    const error = ensureError(original, 'context');
    expect(error).toBe(original);
    expect(error.message).toBe('context;  inner');
  });

  it('reads message from object-like value', () => {
    const error = ensureError({ message: 'from-object' });
    expect(error.message).toBe('from-object');
  });

  it('stringifies unknown values', () => {
    const error = ensureError(42);
    expect(error.message).toBe('42');
  });
});

describe('ensureErrorMessage', () => {
  it('returns string input unchanged', () => {
    expect(ensureErrorMessage('plain')).toBe('plain');
  });

  it('returns Error.message', () => {
    expect(ensureErrorMessage(new Error('err'))).toBe('err');
  });

  it('reads message property from object', () => {
    expect(ensureErrorMessage({ message: 'obj' })).toBe('obj');
  });

  it('stringifies other values', () => {
    expect(ensureErrorMessage({ code: 1 })).toBe('{"code":1}');
  });
});
