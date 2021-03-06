import { ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import fs from 'fs';
import { fromPairs } from 'lodash';
import mkdirp from 'mkdirp';
import { tmpdir } from 'os';
import path from 'path';
import sh from 'shelljs';
import { v4 as uuidv4 } from 'uuid';
import rimraf = require('rimraf');

export { mkdirp };

export async function exists(p: string) {
  try {
    return await fs.promises.stat(p);
  } catch (e) {
    return;
  }
}

export function existsSync(p: string) {
  try {
    return fs.statSync(p);
  } catch (e) {
    return;
  }
}

export function rmdir(path: string) {
  return new Promise((resolve, reject) => {
    rimraf(path, (err) => {
      if (err) reject(err);
      else resolve(path);
    });
  });
}

export function execSafe(command: string, options?: sh.ExecOptions) {
  let cp!: ChildProcess;
  const promise = new Promise<sh.ExecOutputReturnValue>((resolve) => {
    const cb: sh.ExecCallback = (code, stdout, stderr) => {
      resolve({ code, stdout, stderr });
    };
    if (options) {
      cp = sh.exec(command, options, cb);
    } else {
      cp = sh.exec(command, cb);
    }
  });
  return { cp, promise };
}

export async function exec(command: string, options?: sh.ExecOptions) {
  const { code, stdout, stderr } = await execSafe(command, options).promise;
  if (code !== 0) throw stderr;
  return stdout;
}

export async function run<T = unknown>(fn: () => T | PromiseLike<T>) {
  try {
    await fn();
    process.exit(0);
  } catch (e) {
    logError(e);
    process.exit(1);
  }
}

export async function runSafe<T = unknown>(fn: () => T | PromiseLike<T>) {
  try {
    await fn();
  } catch (e) {
    logError(e);
  }
}

export function logError(e: unknown) {
  if (isEmptyError(e)) {
    // ignore
  } else if (isStringError(e)) {
    console.error(e.message);
  } else {
    console.error(e);
  }
}

export async function hashFolder(
  dirname: string,
  name?: string,
  filter?: (filePath: string) => boolean | undefined | null,
): Promise<FolderHash> {
  const fileNames = await fs.promises.readdir(dirname);
  const children = (
    await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(dirname, fileName);
        const match = typeof filter === 'function' ? filter(filePath) : true;
        if (match === false) return;
        try {
          const stat = await fs.promises.stat(filePath);
          if (stat.isDirectory()) {
            const result = await hashFolder(filePath, fileName, match ? void 0 : filter);
            const cdr = result.children;
            if (!cdr || !cdr.length) return;
            return result;
          }
          if (!match) return;
          return {
            name: fileName,
            hash: await hashFile(filePath),
          };
        } catch (e) {
          if ((e as { code: string }).code === 'ENOENT') {
            console.warn(`path ${JSON.stringify(filePath)} points to non-existed file`);
            return;
          }
          throw e;
        }
      }),
    )
  ).filter(predicate);
  return {
    name: name ?? '.',
    hash: hashMap(fromPairs(children.map((child) => [child.name, child.hash]))),
    children,
  };
}

export function hashMap(map: { readonly [key: string]: string }) {
  return md5(JSON.stringify(map));
}

export function hashFile(filePath: string) {
  return new Promise<string>((resolve) => {
    const hashStream = createHash('md5');
    hashStream.setEncoding('hex');
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(hashStream);
    fileStream.on('end', () => {
      hashStream.end();
      resolve(String(hashStream.read()));
    });
  });
}

export function md5(input: string | Buffer | NodeJS.TypedArray | DataView) {
  const hash = createHash('md5');
  hash.update(input);
  return hash.digest('hex');
}

export interface FolderHash {
  name: string;
  hash: string;
  children?: FolderHash[];
}

export interface ExternalPromise<T = unknown> {
  promise: PromiseLike<T>;
  resolve(value: T | PromiseLike<T>): void;
  reject(error: unknown): void;
}

export function createExternalPromise<T>(): ExternalPromise<T> {
  type Type = ExternalPromise<T>;
  let resolve!: Type['resolve'];
  let reject!: Type['reject'];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
}

export type ConcurrentTask<T> = () => PromiseLike<T>;

export class Concurrent {
  private requests: Array<ExternalPromise<void>> = [];
  public executed = 0;
  public count = 0;

  readonly events = new EventEmitter();

  constructor(private readonly max: number) {}

  private async _run<T>(fn: () => T | PromiseLike<T>) {
    this.count++;
    this.executed++;
    try {
      return await fn();
    } finally {
      this.count--;
      this._release();
      this.events.emit('done', this);
    }
  }

  private _release() {
    const first = this.requests.shift();
    if (!first) return;
    first.resolve();
  }

  public async run<T>(fn: () => T | PromiseLike<T>) {
    if (this.count < this.max) {
      return this._run(fn);
    }
    const ep = createExternalPromise<void>();
    this.requests.push(ep);
    await ep.promise;
    return this._run(fn);
  }
}

export function readFileSafeSync(filePath: string) {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return;
  } catch (e) {
    return;
  }
  return fs.readFileSync(filePath);
}

export async function copyFiles(
  sourceDir: string,
  targetDir: string,
  params: { deep?: boolean; allFile?: boolean; files?: string[] } = {},
) {
  const {
    deep = false,
    allFile = false,
    files = (await fs.promises.readdir(sourceDir)).filter((x) =>
      allFile ? !['.DS_Store', '.', '..'].includes(x) : !x.match(/^\./),
    ),
  } = params;

  const realFiles = files
    .map((x) => path.relative(sourceDir, path.resolve(sourceDir, x)))
    .filter((x) => !x.startsWith('../'));

  await Promise.all(
    realFiles.map(async (filePath) => {
      const sourceFilePath = path.join(sourceDir, filePath);
      const targetFilePath = path.join(targetDir, filePath);
      const stat = await fs.promises.stat(sourceFilePath);

      if (stat.isDirectory()) {
        if (!deep) return;

        const hasOtherFiles = realFiles.some((x) => {
          const _x = path.join(sourceDir, x);
          if (_x === sourceFilePath) return false;
          return !path.relative(sourceFilePath, _x).startsWith('../');
        });
        if (hasOtherFiles) return;

        await mkdirp(targetFilePath);
        await copyFiles(sourceFilePath, targetFilePath, {
          deep,
          allFile,
        });
        return;
      }

      await mkdirp(path.dirname(targetFilePath));
      await fs.promises.copyFile(sourceFilePath, targetFilePath);
    }),
  );
}

const $emptyError = Symbol('empty error');
const $stringError = Symbol('string error');

export function createEmptyError(): Error {
  const error: Error & { [$emptyError]?: unknown } = new Error('');
  error[$emptyError] = true;
  return error;
}

export function createStringError(message: string): Error {
  const error: Error & { [$stringError]?: unknown } = new Error(message);
  error[$stringError] = true;
  return error;
}

export function isEmptyError(x: unknown) {
  return Boolean(x && typeof x === 'object' && (x as { readonly [$emptyError]?: unknown })[$emptyError]);
}

export function isStringError(x: unknown): x is { readonly message?: unknown } {
  return Boolean(x && typeof x === 'object' && (x as { readonly [$stringError]?: unknown })[$stringError]);
}

export async function getDirectories(dir: string) {
  return filterAsync(fs.promises.readdir(dir), async (fileName) => {
    const stat = await fs.promises.stat(path.join(dir, fileName));
    return stat.isDirectory();
  });
}

export async function filterAsync<T>(
  list: readonly T[] | PromiseLike<readonly T[]>,
  fn: (value: T, index: number) => unknown,
) {
  const result: T[] = [];
  await Promise.all(
    (
      await list
    ).map(async (value, index) => {
      if (await fn(value, index)) {
        result.push(value);
      }
    }),
  );
  return result;
}

export function guardType<T>() {
  return function applyGuard<U extends T>(value: U) {
    return value;
  };
}

export function keyIn<T>(key: string, object: T): key is keyof T & string {
  return key in object;
}

export function predicate<T>(x: T): x is Exclude<T, null | undefined | void | false | 0 | ''> {
  return Boolean(x);
}

export async function requestTempDir<T>(block: (fullPath: string) => T | PromiseLike<T>) {
  const id = (await getTempDirId()) as string;
  try {
    return await block(getTempDirFullPath(id));
  } finally {
    await destroyTempDir(id);
  }
}

export function getTempDirFullPath(id: string) {
  return path.join(tmpdir(), 'verify-version', id);
}

async function getTempDirId() {
  const isLoop = true;
  while (isLoop) {
    const id = uuidv4().replace(/-/g, '');
    const fullPath = getTempDirFullPath(id);
    if (await exists(fullPath)) continue;
    exec(`mkdir -p ${JSON.stringify(fullPath)}`, { silent: true });
    return id;
  }
}

async function destroyTempDir(id: string) {
  const fullPath = getTempDirFullPath(id);
  await exec(`rm -rf ${JSON.stringify(fullPath)}`, { silent: true });
}

export async function readJson<T>(inputPath: string): Promise<T> {
  const buffer = await fs.promises.readFile(inputPath);
  return JSON.parse(buffer.toString('utf8'));
}

export async function writeJson<T>(inputPath: string, json: T) {
  return fs.promises.writeFile(inputPath, JSON.stringify(json, null, 2));
}
