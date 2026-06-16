import * as nestCommon from '@jshow/nest-common';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogTimestamp, extractMessage } from '../../src/utils/format';

describe('createLogTimestamp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null formatter when config key is missing', () => {
    vi.spyOn(nestCommon, 'getConfig').mockReturnValue(void 0 as never);
    const format = createLogTimestamp('logger.timeFormat');
    expect(format()).toBeNull();
  });

  it('formats current time when config key is set', () => {
    vi.spyOn(nestCommon, 'getConfig').mockReturnValue('YYYY' as never);
    const format = createLogTimestamp('logger.timeFormat');
    expect(format()).toMatch(/^\d{4}$/);
  });
});

describe('extractMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty string for undefined info', () => {
    expect(extractMessage()).toBe('');
  });

  it('formats plain string message', () => {
    vi.spyOn(nestCommon, 'getConfig').mockReturnValue(void 0 as never);
    const output = extractMessage({ message: 'hello' });
    expect(output).toContain('hello');
  });

  it('formats Error message without stack via toString', () => {
    vi.spyOn(nestCommon, 'getConfig').mockReturnValue(void 0 as never);
    const error = new Error('boom');
    delete (error as { stack?: string }).stack;
    const output = extractMessage({ message: error });
    expect(output).toContain('boom');
  });

  it('includes extra metadata fields', () => {
    vi.spyOn(nestCommon, 'getConfig').mockReturnValue(void 0 as never);
    const output = extractMessage({
      message: 'done',
      requestId: 'req-1'
    });
    expect(output).toContain('requestId');
    expect(output).toContain('req-1');
  });
});
