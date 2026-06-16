import 'reflect-metadata';
import { describe, expect, it } from 'vitest';

import {
  Argument,
  Command,
  META_COMMAND,
  META_COMMAND_ARGUMENTS,
  META_COMMAND_OPTIONS,
  Option
} from '../src/decorators/command.decorator';
import {
  Console,
  Commands,
  META_CONSOLE,
  META_MODULE_COMMANDS
} from '../src/decorators/console.decorator';

describe('Console decorator', () => {
  it('stores prefix metadata on command class', () => {
    @Console('app')
    class AppCommand {}

    expect(Reflect.getMetadata(META_CONSOLE, AppCommand)).toEqual({
      prefix: 'app'
    });
  });
});

describe('Commands decorator', () => {
  it('stores command classes on module', () => {
    class ModuleTarget {}

    @Console()
    class FirstCommand {}

    @Console()
    class SecondCommand {}

    Commands([FirstCommand, SecondCommand])(ModuleTarget);

    expect(Reflect.getMetadata(META_MODULE_COMMANDS, ModuleTarget)).toEqual([
      FirstCommand,
      SecondCommand
    ]);
  });
});

describe('Command decorator', () => {
  it('stores command metadata on method', () => {
    @Console()
    class DemoCommand {
      @Command({ name: 'sync', description: 'sync data', alias: 's' })
      protected sync() {}
    }

    const meta = Reflect.getMetadata(META_COMMAND, DemoCommand, 'sync');
    expect(meta).toEqual({
      name: 'sync',
      description: 'sync data',
      alias: 's'
    });
  });
});

describe('Option decorator', () => {
  it('stores option metadata with parameter index', () => {
    @Console()
    class DemoCommand {
      @Command({ name: 'run' })
      protected run(
        @Option({ name: 'verbose', description: 'verbose output' })
        _verbose: boolean
      ) {}
    }

    const options = Reflect.getMetadata(
      META_COMMAND_OPTIONS,
      DemoCommand,
      'run'
    ) as Array<{ name: string; parameterIndex: number }>;

    expect(options).toHaveLength(1);
    expect(options[0]?.name).toBe('verbose');
    expect(options[0]?.parameterIndex).toBe(0);
  });

  it('throws when option name is duplicated', () => {
    const createDuplicateOptionCommand = () => {
      @Console()
      class DuplicateCommand {
        @Command({ name: 'run' })
        protected run(
          @Option({ name: 'dup', description: 'first' }) _a: string,
          @Option({ name: 'dup', description: 'second' }) _b: string
        ) {}
      }

      return DuplicateCommand;
    };

    expect(createDuplicateOptionCommand).toThrow(
      /Duplicated option definition by name: dup/
    );
  });
});

describe('Argument decorator', () => {
  it('stores argument metadata with parameter index', () => {
    @Console()
    class DemoCommand {
      @Command({ name: 'greet' })
      protected greet(
        @Argument({ name: 'name', description: 'target name' }) _name: string
      ) {}
    }

    const args = Reflect.getMetadata(
      META_COMMAND_ARGUMENTS,
      DemoCommand,
      'greet'
    ) as Array<{ name: string; parameterIndex: number }>;

    expect(args).toHaveLength(1);
    expect(args[0]?.name).toBe('name');
    expect(args[0]?.parameterIndex).toBe(0);
  });

  it('throws when argument name is duplicated', () => {
    const createDuplicateArgumentCommand = () => {
      @Console()
      class DuplicateCommand {
        @Command({ name: 'run' })
        protected run(
          @Argument({ name: 'id', description: 'first' }) _a: string,
          @Argument({ name: 'id', description: 'second' }) _b: string
        ) {}
      }

      return DuplicateCommand;
    };

    expect(createDuplicateArgumentCommand).toThrow(
      /Duplicated argument definition by name: id/
    );
  });
});
