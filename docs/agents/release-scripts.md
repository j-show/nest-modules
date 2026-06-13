# Release And Script Agent Guide

Load this when editing `scripts/`, package build scripts, CI publish workflow, or
release-related package metadata.

## Script Map

| Command | Script | Role |
| ------- | ------ | ---- |
| `pnpm run build:all` | `scripts/build-all.ts` | Build packages in dependency order with cache support. |
| `pnpm run build:update -- <package>` | `scripts/build-update.ts` | Update build cache for one package. |
| `pnpm run deps:check` | `scripts/explicit-deps.ts --check-only` | Validate explicit `@jshow/*` dependencies from source imports. |
| `pnpm run deps:fix` | `scripts/explicit-deps.ts` | Rewrite package manifests to add missing internal dependencies. |
| `pnpm run create:pkg -- <name>` | `scripts/create-pkg.ts` | Copy `template/` into `packages/<name>` and fill package metadata. |
| `pnpm run sync-to-node-modules` | `scripts/sync-to-node-modules.ts` | Sync packages into local node_modules for development. |
| `pnpm run release` | `scripts/release-all.ts` | Interactive package release flow. |
| `pnpm run recall` | `scripts/release-recall.ts` | Recall/unpublish helper for suffixed branch packages. |
| `pnpm run publish:tag -- <tag>` | `scripts/publish-tag.ts` | Publish packages listed in a release tag message. |

## Build Flow

- `scripts/build-all.ts` reads `packages/*/package.json`, sorts packages by `@jshow/*` dependencies, and builds in dependency order.
- Build cache lives in `build-cache/` and compares package source, package files, and optionally `package.json`.
- `scripts/build/common.ts` treats `src` and `components` as possible source folders.
- Vite package configs currently emit `dist/index.mjs`, `dist/index.cjs`, and declarations under `dist`.

## Known Migration Risks

| Area | Current state | Agent rule |
| ---- | ------------- | ---------- |
| Package manager | Root uses pnpm, `.npmrc`, and `pnpm-lock.yaml`; CI still uses npm; scripts still contain yarn strings. | Ask before normalizing package managers. |
| Old build configs | Package scripts and `scripts/build-self.ts` reference `tsconfig.build*.json`; current packages do not have those files. | Verify intended build path before editing build scripts. |
| Lodash imports | Root dev deps include `lodash-es`; scripts import `lodash`; some source imports also use `lodash`. | Ask before choosing dependency add vs import migration. |
| Publish scope | Main packages use `@jshow`; `scripts/release-recall.ts` contains `@arkie` in an unpublish command. | Treat recall flow as dangerous and ask before running or changing it. |
| Generated output | Packages publish `dist`; template still describes `lib` and `lib-es`. | Do not create new packages from template without checking expected output layout. |

## Release Boundaries

### Always do

- Read the release script before changing a command that can publish, unpublish, tag, push, or rewrite manifests.
- Check `git status --short` before release-related work; `scripts/release-all.ts` requires a clean workspace.
- Keep build cache behavior and package dependency ordering in mind when changing build scripts.
- Preserve exact CLI flags when documenting or invoking scripts.

### Ask first

- Running `pnpm run release`, `pnpm run recall`, or `pnpm run publish:tag -- <tag>`.
- Changing `.github/workflows/npm-publish.yml`, npm registry behavior, or token usage.
- Changing version derivation, branch suffix rules, tag names, or package publish names.
- Adding `lodash`, replacing `lodash` with `lodash-es`, or changing script module imports broadly.

### Never do

- Run recall/unpublish scripts as a validation step.
- Patch a release script by guessing the intended package manager.
- Commit regenerated lockfiles or package manifests from `deps:fix` without explaining the exact dependency changes.
- Delete `build-cache/` or package output as a substitute for fixing build logic unless cleanup was requested.

## CI Notes

`.github/workflows/npm-publish.yml` runs on GitHub release creation:

- `actions/setup-node@v3` with Node `16`
- `npm i && npm run build:all`
- `npm run publish:tag "$RELEASE_TAG"` with `NODE_AUTH_TOKEN`

This differs from the local pnpm workspace. Treat CI/package-manager alignment as
a deliberate maintenance task, not an incidental cleanup.
