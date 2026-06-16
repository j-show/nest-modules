import { describe, expect, it } from 'vitest';

import {
  AccessDeniedException,
  UnauthorizedException
} from '../../../src/modules/exception/authorized';
import {
  ConflictException,
  DuplicatedDefinitionException,
  RuntimeException
} from '../../../src/modules/exception/base';
import {
  EmptyParameterException,
  InvalidParameterException
} from '../../../src/modules/exception/parameter';

describe('RuntimeException', () => {
  it('sets code, status, and message', () => {
    const error = new RuntimeException('failed', 503, { detail: true });
    expect(error.code).toBe('RUNTIME');
    expect(error.getStatus()).toBe(503);
    expect(error.message).toBe('failed');
    expect(error.data).toEqual({ detail: true });
  });
});

describe('ConflictException', () => {
  it('uses default message when data is omitted', () => {
    const error = new ConflictException();
    expect(error.code).toBe('CONFLICT');
    expect(error.getStatus()).toBe(409);
    expect(error.message).toBe('CONFLICT');
  });

  it('uses string data as message', () => {
    const error = new ConflictException('already exists');
    expect(error.message).toBe('already exists');
  });

  it('builds message from entity payload', () => {
    const error = new ConflictException({
      entity: 'User',
      conditions: 'email'
    });
    expect(error.message).toBe('User with email has been taken');
    expect(error.data).toEqual({ entity: 'User', conditions: 'email' });
  });
});

describe('DuplicatedDefinitionException', () => {
  it('describes duplicated option definition', () => {
    const error = new DuplicatedDefinitionException({
      type: 'option',
      name: 'verbose'
    });
    expect(error.code).toBe('DUPLICATED_DEFINITION');
    expect(error.message).toBe('Duplicated option definition by name: verbose');
  });
});

describe('EmptyParameterException', () => {
  it('includes parameter name in message', () => {
    const error = new EmptyParameterException({ name: 'id' });
    expect(error.code).toBe('EMPTY_PARAMETER');
    expect(error.getStatus()).toBe(400);
    expect(error.message).toBe("Value of prarameter 'id' is empty!");
  });
});

describe('InvalidParameterException', () => {
  it('includes parameter name in message', () => {
    const error = new InvalidParameterException({ name: 'page' });
    expect(error.code).toBe('INVALID_PARAMETER');
    expect(error.message).toBe("Invalid parameter 'page'!");
  });
});

describe('AccessDeniedException', () => {
  it('includes class, member, and required features', () => {
    const error = new AccessDeniedException({
      className: 'Orders',
      memberName: 'delete',
      featuresRequired: 'admin'
    });
    expect(error.code).toBe('ACCESS_DENIED');
    expect(error.getStatus()).toBe(403);
    expect(error.message).toContain('Orders@delete');
    expect(error.message).toContain('admin');
  });
});

describe('UnauthorizedException', () => {
  it('uses payload message as response text', () => {
    const error = new UnauthorizedException({ message: 'token expired' });
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.getStatus()).toBe(401);
    expect(error.message).toBe('token expired');
  });
});
