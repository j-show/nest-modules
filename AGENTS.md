# @jshow/nest-modules — Agent Instructions

For humans: see [README.md](README.md).

## Project

This is a TypeScript pnpm workspace for `@jshow` Nest-related packages. The root
package is private; publishable code lives under `packages/*`. README currently
describes the repo as "External modules for Next.js"; package metadata names the
modules as Nest Common, Nest Console, and Nest Logger.

## Environment

- Node.js: current workspace was inspected on Node `v22.18.0`.
- Package manager: `pnpm >=10` from `package.json#engines`.
- TypeScript: `pnpm exec tsc --version` reports `5.9.3`.
- Vite: `pnpm exec vite --version` reports `8.0.10`.
- ESLint: `pnpm exec eslint --version` reports `9.39.4`.
- Registry config: `.npmrc` points installs at `https://registry.npmmirror.com`.
- Env files: no `.env.example` or runtime env contract was found.

## Commands

Run from repository root unless noted:

- `pnpm install` — install workspace dependencies and catalogs.
- `pnpm run eslint .` — run ESLint with the root flat config and autofix.
- `pnpm run prettier` — format the repository with `.prettierrc`.
- `pnpm exec tsc --noEmit -p tsconfig.json` — root TypeScript check.
- `pnpm run deps:check` — validate explicit `@jshow/*` package dependencies.
- `pnpm run deps:fix` — rewrite package manifests to add missing explicit dependencies.
- `pnpm run clean` — remove `packages/**/dist`.
- `pnpm run build:all` — topological package build through `scripts/build-all.ts`.
- `pnpm --filter @jshow/nest-common run build` — build one package with Vite.
- `pnpm --filter @jshow/nest-console run build` — build one package through its package script.
- `pnpm --filter @jshow/nest-logger run build` — build one package through its package script.
- `pnpm run create:pkg -- <name> --desc "<description>"` — scaffold a package from `template/`.

Release commands exist but are not routine verification commands:

- `pnpm run release` — interactive release flow; requires clean git state.
- `pnpm run recall` — destructive recall/unpublish helper for suffixed branch packages.
- `pnpm run publish:tag -- <tag>` — publish packages described by a release tag.

## Structure

| Path | Role |
| ---- | ---- |
| `packages/nest-common` | Shared constants, exception types, Fastify helpers, types, and utilities. |
| `packages/nest-console` | Nest console module, service, decorators, and command metadata. |
| `packages/nest-logger` | Nest logger core, middleware, transports, and log formatting utilities. |
| `scripts/` | Workspace build, dependency, package creation, release, and publish helpers. |
| `template/` | Files copied by `pnpm run create:pkg`. |
| `.github/workflows/npm-publish.yml` | Release-created npm publish workflow. |
| `docs/agents/` | Deeper agent notes linked from this file. |
| `amazon-mono/` | External monorepo snapshot — **read-only**; do not modify (see Boundaries). |
| `arkie-monorepo/` | External monorepo snapshot — **read-only**; do not modify (see Boundaries). |

## Boundaries

### Always do

- Read the target package `package.json`, `tsconfig.json`, and `vite.config.ts` before changing build or exports.
- Keep public exports in `src/index.ts` aligned when adding or moving public APIs.
- Run the smallest relevant check first, then broaden to `pnpm exec tsc --noEmit -p tsconfig.json` or `pnpm run build:all`.
- Preserve workspace dependency declarations; run `pnpm run deps:check` after changing imports across `@jshow/*` packages.
- Mention current known failures if they block full verification.

### Ask first

- Changing publish behavior, release scripts, package names, versions, npm scopes, or CI publish workflow.
- Replacing pnpm/yarn/npm usage across the repo; this codebase currently contains a partial migration.
- Adding runtime dependencies, changing catalogs, or regenerating `pnpm-lock.yaml`.
- Deleting generated-looking files such as `dist/`, `build-cache/`, or package-local `node_modules/`.
- Modifying broad formatting, lint rules, or TypeScript strictness for the whole workspace.

### Never do

- Modify, create, delete, or format any file under `amazon-mono/`、`arkie-monorepo/` at the repository root. Treat that directory as out of scope unless the user explicitly requests changes there.
- Run `pnpm run release`, `pnpm run recall`, or `pnpm run publish:tag` without explicit approval.
- Commit credentials, registry tokens, `.env` files, `node_modules`, or npm auth config.
- Force-push, reset hard, or revert user changes to fix local verification.
- Assume package scripts that reference `tsconfig.build*.json` are valid without checking the files exist.
- Change package `exports` without also checking generated `dist` file names and Vite library formats.

## Verification

For source changes:

1. `pnpm run eslint <changed-files-or-dirs>`
2. `pnpm exec tsc --noEmit -p tsconfig.json`
3. `pnpm run deps:check` when imports or dependencies changed
4. `pnpm run build:all` before claiming package build/release readiness

For documentation-only changes:

1. `pnpm exec prettier --check AGENTS.md docs/agents/*.md`
2. `git diff --check`

## Known Current State

| Symptom | Fix or status |
| ------- | ------------- |
| `pnpm exec tsc --noEmit -p tsconfig.json` reports `TS1005` in `packages/nest-logger/src/utils/format.ts` | Current source contains split tokens around `info`, `result`, and `stack`; fix source before using tsc as a green gate. |
| `pnpm run deps:check` fails with `Cannot find module 'lodash'` | Scripts import `lodash` while root dependencies include `lodash-es`; confirm dependency strategy before changing manifests or imports. |
| Package scripts reference `tsconfig.build.json` and `tsconfig.build.es.json` | Current packages only have `tsconfig.json` plus `vite.config.ts`; verify the intended build path before editing scripts. |
| CI uses `npm i && npm run build:all` | Root package now declares pnpm and has `pnpm-lock.yaml`; ask before changing CI/package-manager behavior. |

## Document Map

| Doc | Purpose |
| --- | ------- |
| [README.md](README.md) | Human overview. |
| [docs/agents/packages.md](docs/agents/packages.md) | Package layout, API exports, and package-level development rules. |
| [docs/agents/release-scripts.md](docs/agents/release-scripts.md) | Build, dependency, release, publish, and migration-risk notes. |

## Done Checklist

- [ ] Scope stayed inside the requested package or script area; `amazon-mono/`、`arkie-monorepo/` was not touched.
- [ ] Public exports and package manifests match implementation changes.
- [ ] Relevant commands above were run, or blockers are reported with exact errors.
- [ ] No release, publish, recall, or destructive git command was run without approval.
