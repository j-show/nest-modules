# Package Agent Guide

Load this when editing files under `packages/*`.

## Workspace Packages

| Package | Entry | Current build output | Role |
| ------- | ----- | -------------------- | ---- |
| `@jshow/nest-common` | `packages/nest-common/src/index.ts` | `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` | Shared Nest constants, exceptions, Fastify helpers, types, and utilities. |
| `@jshow/nest-console` | `packages/nest-console/src/index.ts` | `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` | Console module, service, decorators, and command metadata. |
| `@jshow/nest-logger` | `packages/nest-logger/src/index.ts` | `dist/index.mjs`, `dist/index.cjs`, `dist/index.d.ts` | Logger core, middleware, transports, and formatting utilities. |

## Package Commands

Run from the repository root:

- `pnpm --filter @jshow/nest-common run build` — Vite build for `nest-common`.
- `pnpm --filter @jshow/nest-console run build` — package build for `nest-console`.
- `pnpm --filter @jshow/nest-logger run build` — package build for `nest-logger`.
- `pnpm exec tsc --noEmit -p packages/nest-common/tsconfig.json` — typecheck one package.
- `pnpm exec tsc --noEmit -p packages/nest-console/tsconfig.json` — typecheck one package.
- `pnpm exec tsc --noEmit -p packages/nest-logger/tsconfig.json` — typecheck one package.
- `pnpm run deps:check` — catch missing explicit workspace package dependencies.

Package-local `lint`, `test`, and `tsc` scripts currently reference older
`yarn`, `type-coverage`, and `tsconfig.build.json` flows. Verify those files and
dependencies before treating package-local scripts as authoritative.

## Source Layout

| Path | Notes |
| ---- | ----- |
| `packages/*/src/index.ts` | Public export surface for each package. |
| `packages/*/vite.config.ts` | Library build config; externalizes package dependencies and emits ESM/CJS plus d.ts. |
| `packages/*/tsconfig.json` | Extends `../../tsconfig.base.json`; includes `src`, excludes `dist`. |
| `packages/*/package.json` | npm package metadata, exports, files, scripts, and runtime dependencies. |

## Editing Rules

### Always do

- Update `src/index.ts` when a new public symbol should be exported.
- Keep `package.json#exports` consistent with the files emitted by `vite.config.ts`.
- Add new cross-package imports to `dependencies` or `devDependencies`; validate with `pnpm run deps:check`.
- Prefer existing dependency style in each package: most runtime imports use catalog entries or `workspace:*`.
- Check both ESM and CJS consumers when editing library output shape.

### Ask first

- Renaming packages, changing `@jshow` scope, or changing published file names.
- Moving a package from Vite `dist/` output back to old `lib` / `lib-es` output.
- Changing Nest major versions or peer/runtime dependency strategy.
- Adding tests or tooling that requires new dependencies.

### Never do

- Delete an export because it appears unused inside this repo; these are library packages.
- Edit generated `dist/` as the source of truth.
- Assume package-local `node_modules` content is intentional source state.
- Change `files`, `exports`, or package names without checking npm publish impact.

## Current Package Notes

- `nest-common` depends on `@nestjs/platform-fastify`, `fastify`, `config`, `dayjs`, `lodash-es`, and `@jshow/logger`.
- `nest-console` depends on `@jshow/nest-common`, `@nestjs/common`, `@nestjs/core`, and `reflect-metadata`.
- `nest-logger` depends on `@jshow/nest-common`, `debug`, `lodash-es`, `strip-ansi`, and Nest common APIs.
- Some source imports still use `lodash` rather than `lodash-es`; confirm whether that is intentional before fixing dependency errors.

## Package Verification

Use the narrowest check that covers the edit:

1. `pnpm exec tsc --noEmit -p packages/<name>/tsconfig.json`
2. `pnpm --filter @jshow/<name> run build`
3. `pnpm run deps:check` if imports changed
4. `pnpm run build:all` for cross-package changes
