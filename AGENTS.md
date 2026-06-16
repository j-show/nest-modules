# @jshow/nest-modules — Agent Instructions

For humans: see [README.md](README.md).

## Project

This is a TypeScript pnpm workspace for `@jshow` Nest-related packages. The root
package is private; publishable code lives under `packages/*`. README describes
the repo as Nest Common, Nest Console, and Nest Logger modules built with Vite
and consumed as ESM/CJS libraries.

## Environment

- Node.js: `>=22` (`package.json#engines`).
- Package manager: `pnpm >=11` (`package.json#engines`, `pnpm-workspace.yaml`).
- TypeScript 5, Vite 8, ESLint 9, Vitest 4 (root devDependencies).
- Registry config: `.npmrc` points installs at `https://registry.npmmirror.com`.
- Env files: no `.env.example`; runtime config is read via the `config` package
  and a few process env vars (see README).

## Commands

Run from repository root unless noted:

- `pnpm install` — install workspace dependencies and catalogs.
- `pnpm run lint` — ESLint with root flat config (`eslint.config.mjs`) and autofix.
- `pnpm run prettier` — format the repository with `.prettierrc`.
- `pnpm run test` — run all Vitest suites once.
- `pnpm run test:watch` — run Vitest in watch mode.
- `pnpm run build` — clean `packages/**/dist`, then `pnpm -r build`.
- `pnpm run build:clean` — remove `packages/**/dist` only.
- `pnpm --filter @jshow/nest-common run build` — Vite build one package.
- `pnpm --filter @jshow/nest-console run build` — Vite build one package.
- `pnpm --filter @jshow/nest-logger run build` — Vite build one package.
- `pnpm --filter @jshow/<name> run tsc` — typecheck one package (`tsconfig.json` includes `src` only).

CI (`.github/workflows/pr-check.yml`) runs `pnpm install`, `pnpm run build`, and
`pnpm run test` on pull requests.

## Structure

| Path | Role |
| ---- | ---- |
| `packages/nest-common` | Shared constants, exception types, Fastify helpers, types, and utilities. |
| `packages/nest-console` | Nest console module, service, decorators, and command metadata. |
| `packages/nest-logger` | Nest logger core, middleware, transports, and log formatting utilities. |
| `packages/*/src/` | Package implementation; public surface is `src/index.ts`. |
| `packages/*/test/` | Vitest suites for each package (`**/*.test.ts`). |
| `vitest.config.ts` | Root Vitest config; aliases `@jshow/*` workspace imports to package `src`. |
| `docs/agents/` | Deeper agent notes linked from this file. |
| `.github/workflows/pr-check.yml` | PR install, build, and test workflow. |

## Testing

- Test runner: **Vitest 4** at the workspace root (`vitest.config.ts`).
- Test location: `packages/<name>/test/**/*.test.ts` — keep tests out of `src/`.
- Imports in tests: reference implementation via relative paths such as
  `../../src/utils/error` or package aliases (`@jshow/nest-common`) when mocking
  cross-package boundaries.
- `nest-console` decorator tests require `import 'reflect-metadata'` in the test
  file (provided by the package dependency, not root).
- After behavior changes, update or add cases under the relevant package `test/`
  directory and run `pnpm run test`.

## Boundaries

### Always do

- Read the target package `package.json`, `tsconfig.json`, and `vite.config.ts` before changing build or exports.
- Keep public exports in `src/index.ts` aligned when adding or moving public APIs.
- Place new tests under `packages/<name>/test/`, mirroring the `src/` layout where practical.
- Run the smallest relevant check first: `pnpm run lint` on changed paths, then
  `pnpm run test`, then per-package `tsc` / `build` as needed.
- Mention current known failures if they block full verification.

### Ask first

- Changing publish behavior, package names, versions, npm scopes, or CI workflows.
- Adding runtime dependencies, changing `pnpm-workspace.yaml` catalogs, or regenerating `pnpm-lock.yaml`.
- Deleting generated-looking files such as `dist/` or package-local `node_modules/`.
- Modifying broad formatting, lint rules, or TypeScript strictness for the whole workspace.

### Never do

- Run destructive publish or unpublish flows without explicit approval.
- Commit credentials, registry tokens, `.env` files, `node_modules`, or npm auth config.
- Force-push, reset hard, or revert user changes to fix local verification.
- Change package `exports` without also checking generated `dist` file names and Vite library formats.
- Edit generated `dist/` as the source of truth.

## Verification

For source changes:

1. `pnpm run lint -- <changed-files-or-dirs>`
2. `pnpm run test` (or a scoped Vitest run on the touched `test/` file)
3. `pnpm --filter @jshow/<name> run tsc` for the edited package
4. `pnpm --filter @jshow/<name> run build` when build output or exports changed
5. `pnpm run build` before claiming full workspace build readiness

For documentation-only changes:

1. `pnpm exec prettier --check AGENTS.md docs/agents/*.md`
2. `git diff --check`

## Known Current State

| Symptom | Fix or status |
| ------- | ------------- |
| `packages/nest-core/package.json` is incomplete / invalid JSON | Blocks some `pnpm --filter` and workspace-wide commands until fixed or removed from `packages/`. |
| Root `pnpm exec tsc --noEmit -p tsconfig.json` may OOM | Prefer per-package `pnpm --filter @jshow/<name> run tsc`. |
| `package.json#scripts.lint` references `eslint.config.js` | Actual config file is `eslint.config.mjs`; align script if `pnpm run lint` fails to find config. |
| `docs/agents/release-scripts.md` describes `scripts/` helpers | `scripts/` directory is not present in the current tree; treat that doc as historical unless scripts are restored. |
| Package `postbuild1` scripts reference `pnpm build:update` | Root `build:update` script is not defined; postbuild hook is effectively inert. |

## Document Map

| Doc | Purpose |
| --- | ------- |
| [README.md](README.md) | Human overview, usage examples, env/config table. |
| [docs/agents/packages.md](docs/agents/packages.md) | Package layout, API exports, and package-level development rules. |
| [docs/agents/release-scripts.md](docs/agents/release-scripts.md) | Legacy build/release script notes; verify against live `package.json` before relying on it. |

## Done Checklist

- [ ] Scope stayed inside the requested package or area.
- [ ] Public exports and package manifests match implementation changes.
- [ ] Tests added or updated under `packages/<name>/test/` when behavior changed.
- [ ] Relevant commands above were run, or blockers are reported with exact errors.
- [ ] No destructive publish or git command was run without approval.
