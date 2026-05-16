# Monorepo Consolidation: Single Package Migration

## Overview

Consolidate the project from a two-package monorepo (root package + ai-harness-cli) to a single package at the root level. The CLI already contains all necessary logic; the root package is unused.

## Current State Analysis

### Root Package (`/src/` contains)
- `ConfigParser.ts` - TOML parsing with validation
- `Orchestrator.ts` - Component loading and workflow execution
- `SensorRegistry.ts` - Sensor management
- `types/harness.ts` - TypeScript interfaces
- Tests for all above

### CLI Package (`/ai-harness-cli/src/` contains)
- **Already has**: TOML parsing in `validate.ts` using `@iarna/toml`
- **Already has**: `HarnessConfiguration` type equivalent to root's `HarnessConfig`
- **Already has**: All scaffolding, validation, and command logic
- **No dependencies** on root package (verified by grep search)

### Current Version State
- Root package: v0.1.1
- CLI package: v0.1.3 (already diverged!)

## Consolidation Plan

### Phase 1: Move CLI to Root

Move all files from `ai-harness-cli/` to repository root:

```
ai-harness-cli/               →  (root)
├── package.json              →  package.json
├── tsconfig.json            →  tsconfig.json
├── jest.config.js           →  jest.config.js
├── bin/                     →  bin/
├── src/                     →  src/
├── templates/               →  templates/
├── tests/                   →  tests/
├── .eslintrc.json          →  .eslintrc.json
├── .gitignore              →  .gitignore
└── README.md               →  README.md (merge with root README)
```

### Phase 2: Update Package Configuration

Update the moved `package.json`:
- Keep name: `@piwero/ai-harness-cli`
- Keep version: `0.1.3` (the current CLI version, which is ahead)
- Update any path references that assumed subdirectory structure
- Ensure bin/ah still works from root

### Phase 3: Delete Root Package

Remove the now-unused root package files:
- Delete `/src/` directory
- Delete root `package.json`
- Delete root `jest.config.js`
- Delete root `tsconfig.json`
- Delete root `.eslintrc.json`
- Keep root `.gitignore` (merge with CLI's)

### Phase 4: Mise Configuration

Create `mise.toml` at root with:

```toml
[tools]
node = "22"

[env]
NODE_ENV = "development"

[tasks.test]
description = "Run all tests"
run = "npm test"

[tasks.build]
description = "Build TypeScript"
run = "npm run build"

[tasks.release:patch]
description = "Bump patch version (0.0.1 -> 0.0.2), commit, tag, and push"
run = "scripts/release.sh patch"

[tasks.release:minor]
description = "Bump minor version (0.1.0 -> 0.2.0), commit, tag, and push"
run = "scripts/release.sh minor"

[tasks.release:major]
description = "Bump major version (0.1.0 -> 1.0.0), commit, tag, and push"
run = "scripts/release.sh major"
```

### Phase 5: Release Script

Create `scripts/release.sh` that:

1. **Pre-flight checks**:
   - Verify `git status` is clean
   - Run `npm test` - must pass
   - Run `npm run build` - must succeed
   - Verify `npm run typecheck` passes

2. **Version bump**:
   - Read current version from `package.json`
   - Calculate new version (patch/minor/major)
   - Update `package.json` version field

3. **Commit and tag**:
   - Stage `package.json` and `package-lock.json`
   - Commit with message: `chore(release): vX.Y.Z`
   - Create annotated git tag: `vX.Y.Z`

4. **Push**:
   - Push commit to origin/current-branch
   - Push tags

## Post-Consolidation Structure

```
ai-harness/
├── bin/                     # CLI entry point
├── src/                     # CLI source code
│   ├── commands/
│   ├── scaffold/
│   ├── types/
│   └── utils/
├── templates/               # Component templates
├── tests/                   # Test suites
├── scripts/
│   └── release.sh          # Version bumping script
├── package.json
├── tsconfig.json
├── jest.config.js
├── mise.toml
├── .eslintrc.json
├── .gitignore
└── README.md
```

## Benefits

1. **Single source of truth**: One version number for the entire project
2. **Simplified maintenance**: No duplication between packages
3. **Clearer architecture**: CLI is the product; no confusion about which package to use
4. **Easier releases**: One release command handles everything
5. **Reduced complexity**: Delete ~300 lines of unused code

## Mise Tasks

### Development Tasks

```toml
[tasks.build]
description = "Build TypeScript"
run = "npm run build"

[tasks.test]
description = "Run all tests"
run = "npm test"

[tasks.lint]
description = "Run ESLint"
run = "npm run lint"

[tasks.typecheck]
description = "Run TypeScript type check"
run = "npm run typecheck"
```

### Release Tasks

```toml
[tasks.release:patch]
description = "Bump patch version (0.0.1 -> 0.0.2), commit, tag, and push"
run = "scripts/release.sh patch"

[tasks.release:minor]
description = "Bump minor version (0.1.0 -> 0.2.0), commit, tag, and push"
run = "scripts/release.sh minor"

[tasks.release:major]
description = "Bump major version (0.1.0 -> 1.0.0), commit, tag, and push"
run = "scripts/release.sh major"
```

## CI/CD Workflow

### GitHub Actions Workflow (`.github/workflows/publish.yml`)

Updated to use mise for consistency with local development:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2
        with:
          install: true
          cache: true

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: mise run build

      - name: Type check
        run: mise run typecheck

      - name: Lint
        run: mise run lint

      - name: Run tests
        run: mise run test

  build-and-publish:
    name: Build and Publish
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2
        with:
          install: true
          cache: true

      - name: Setup Node.js for publishing
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: mise run build

      - name: Verify build
        run: |
          ls -la dist/
          test -f dist/index.js
          test -f bin/ah

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}

  create-release:
    name: Create GitHub Release
    needs: build-and-publish
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
          body: |
            Published to NPM: `@piwero/ai-harness-cli`
            
            Install globally:
            ```bash
            npm install -g @piwero/ai-harness-cli
            ```
```

### Key CI/CD Improvements

1. **Mise consistency**: CI uses same commands as local development (`mise run test`, `mise run build`)
2. **Simplified structure**: No `working-directory` needed after consolidation
3. **Caching**: mise-action caches tool installations
4. **Type safety**: Full typecheck, lint, test, and build before publishing

## Migration Commands

### Local Development

```bash
# Clone and setup
git clone <repo>
cd ai-harness
mise install
npm install

# Development workflow
mise run build      # Compile TypeScript
mise run test       # Run test suite
mise run lint       # Check code style
mise run typecheck  # TypeScript validation

# Release workflow
mise run release:patch  # 0.1.3 → 0.1.4
mise run release:minor  # 0.1.3 → 0.2.0
mise run release:major  # 0.1.3 → 1.0.0
```

### CI/CD Execution

The GitHub Actions workflow automatically:
1. Triggers on git tags matching `v*.*.*`
2. Runs full test suite using mise tasks
3. Builds and publishes to NPM
4. Creates GitHub release with notes

## Testing Strategy

Before finalizing:
1. Verify all CLI tests pass after move
2. Verify CLI binary works from root
3. Test release script with dry-run mode
4. Verify build and typecheck succeed

## Rollback Plan

If issues arise:
- All changes are in git, can be reverted via `git revert`
- The original structure is simple to restore
- No external dependencies affected
