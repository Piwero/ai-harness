# Monorepo Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate ai-harness-cli and root package into a single publishable package using mise for task management

**Architecture:** Move all CLI files to root, delete unused root package code, add mise.toml with development and release tasks, update GitHub Actions to use mise for CI/CD

**Tech Stack:** Node.js 22, TypeScript, Jest, ESLint, mise (task runner), GitHub Actions

---

## Plan Overview

**Prerequisite:** Ensure you're on a clean git branch with all changes committed.

**Estimated time:** 45-60 minutes

**High-level steps:**
1. Move CLI files from ai-harness-cli/ to root
2. Delete obsolete root package files
3. Create mise.toml with tasks
4. Create release script
5. Update GitHub Actions workflow
6. Verify everything works

---

### Task 1: Move CLI Files to Root

**What:** Move all files from ai-harness-cli/ subdirectory to repository root

**Files:**
- Move: `ai-harness-cli/package.json` → `package.json`
- Move: `ai-harness-cli/tsconfig.json` → `tsconfig.json`
- Move: `ai-harness-cli/jest.config.js` → `jest.config.js`
- Move: `ai-harness-cli/.eslintrc.json` → `.eslintrc.json`
- Move: `ai-harness-cli/.gitignore` → merge with root `.gitignore`
- Move: `ai-harness-cli/README.md` → merge with root `README.md`
- Move: `ai-harness-cli/bin/` → `bin/`
- Move: `ai-harness-cli/src/` → `src/`
- Move: `ai-harness-cli/templates/` → `templates/`
- Move: `ai-harness-cli/tests/` → `tests/`

- [ ] **Step 1: Move configuration files**

```bash
# Set the CLI version as the canonical version
cp ai-harness-cli/package.json package.json

# Move all config files
cp ai-harness-cli/tsconfig.json tsconfig.json
cp ai-harness-cli/jest.config.js jest.config.js
cp ai-harness-cli/.eslintrc.json .eslintrc.json

# Move directories
mv ai-harness-cli/bin bin
mv ai-harness-cli/src src
mv ai-harness-cli/templates templates
mv ai-harness-cli/tests tests
```

- [ ] **Step 2: Merge .gitignore files**

Combine root `.gitignore` content with CLI `.gitignore`:

```
# Dependencies
node_modules/
dist/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test artifacts
coverage/
.tmp-test/

# Environment
.env
.env.local

# Build
*.tsbuildinfo
```

- [ ] **Step 3: Merge README.md**

Keep root README header but add CLI documentation:

```markdown
# AI Harness Framework

Composable AI agent harness framework for OpenCode.

## Installation

```bash
npm install -g @piwero/ai-harness-cli
```

## Usage

Initialize a new project:
```bash
ah init
```

Add components:
```bash
ah add typescript
```

Validate configuration:
```bash
ah validate
```

## Development

This project uses mise for task management:

```bash
mise run build    # Build TypeScript
mise run test     # Run tests
mise run lint     # Run linter
mise run typecheck # TypeScript check
```
```

- [ ] **Step 4: Commit the move**

```bash
# Remove the old ai-harness-cli directory first to avoid confusion
rm -rf ai-harness-cli/

# Remove old root files that are now replaced
rm -rf src/  # This is the old root src, CLI src is now in place
rm jest.config.js  # Old root jest config

# Stage and commit
git add -A
git commit -m "refactor: consolidate CLI into root package

- Move ai-harness-cli/ contents to root
- Delete unused root package code
- Merge configuration files
- Single package structure simplifies maintenance"
```

---

### Task 2: Create mise.toml

**What:** Create mise configuration with Node.js version and task definitions

**Files:**
- Create: `mise.toml`

- [ ] **Step 1: Create mise.toml**

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

[tasks.lint]
description = "Run ESLint"
run = "npm run lint"

[tasks.typecheck]
description = "Run TypeScript type check"
run = "npm run typecheck"

[tasks.ci]
description = "Run full CI checks (build, test, lint, typecheck)"
depends = ["build", "test", "lint", "typecheck"]

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

- [ ] **Step 2: Commit mise.toml**

```bash
git add mise.toml
git commit -m "chore: add mise.toml with development and release tasks

- Pin Node.js to version 22
- Add tasks for test, build, lint, typecheck
- Add release tasks with semantic versioning"
```

---

### Task 3: Create Release Script

**What:** Create scripts/release.sh that bumps version, commits, tags, and pushes

**Files:**
- Create: `scripts/release.sh`
- Create: `scripts/` directory

- [ ] **Step 1: Create scripts directory and release.sh**

```bash
mkdir -p scripts
```

```bash
#!/bin/bash
set -e

# Release script for ai-harness-cli
# Usage: ./scripts/release.sh [patch|minor|major]

VERSION_TYPE=${1:-patch}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Error: Version type must be patch, minor, or major"
    echo "Usage: $0 [patch|minor|major]"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting release process...${NC}"

# Step 1: Pre-flight checks
echo -e "${YELLOW}Step 1: Pre-flight checks${NC}"

# Check if git is clean
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: Working directory is not clean. Please commit or stash changes.${NC}"
    git status
    exit 1
fi

echo "✓ Git working directory is clean"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version using semver logic
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        NEW_MAJOR=$((MAJOR + 1))
        NEW_VERSION="${NEW_MAJOR}.0.0"
        ;;
    minor)
        NEW_MINOR=$((MINOR + 1))
        NEW_VERSION="${MAJOR}.${NEW_MINOR}.0"
        ;;
    patch)
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="${MAJOR}.${MINOR}.${NEW_PATCH}"
        ;;
esac

echo "New version: $NEW_VERSION"
echo ""

# Step 2: Install dependencies and verify
echo -e "${YELLOW}Step 2: Installing dependencies${NC}"
npm ci
echo "✓ Dependencies installed"
echo ""

# Step 3: Run checks
echo -e "${YELLOW}Step 3: Running checks${NC}"
echo "Building..."
npm run build
echo "✓ Build successful"

echo "Running tests..."
npm test
echo "✓ Tests pass"

echo "Running typecheck..."
npm run typecheck
echo "✓ Typecheck passes"

echo "Running lint..."
npm run lint
echo "✓ Lint passes"
echo ""

# Step 4: Bump version
echo -e "${YELLOW}Step 4: Bumping version${NC}"
npm version $NEW_VERSION --no-git-tag-version
echo "✓ Version bumped to $NEW_VERSION"
echo ""

# Step 5: Commit and tag
echo -e "${YELLOW}Step 5: Creating commit and tag${NC}"
git add package.json package-lock.json
git commit -m "chore(release): v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
echo "✓ Created commit and tag v${NEW_VERSION}"
echo ""

# Step 6: Push
echo -e "${YELLOW}Step 6: Pushing to remote${NC}"
git push
git push origin "v${NEW_VERSION}"
echo "✓ Pushed commit and tag"
echo ""

echo -e "${GREEN}✓ Release v${NEW_VERSION} complete!${NC}"
echo ""
echo "The GitHub Actions workflow will now:"
echo "  1. Run tests"
echo "  2. Build the package"
echo "  3. Publish to NPM"
echo "  4. Create a GitHub release"
echo ""
echo "Monitor progress at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]//;s/.git$//')/actions"
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x scripts/release.sh
```

- [ ] **Step 3: Commit release script**

```bash
git add scripts/release.sh
git commit -m "chore: add release script for semantic versioning

- Validates clean git state
- Runs full test/build/lint/typecheck suite
- Bumps version in package.json
- Creates commit and annotated tag
- Pushes to remote"
```

---

### Task 4: Update package.json

**What:** Update package.json to ensure it's properly configured for root level

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Verify package.json content**

Ensure the package.json from ai-harness-cli is correct and has these key fields:

```json
{
  "name": "@piwero/ai-harness-cli",
  "version": "0.1.3",
  "description": "CLI tool for AI Harness Framework",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "ah": "./bin/ah"
  },
  "files": [
    "dist",
    "bin",
    "templates",
    "README.md"
  ],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "typecheck": "tsc --noEmit"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Note:** Keep all the dependencies and devDependencies as they were in ai-harness-cli/package.json

- [ ] **Step 2: Install dependencies at root level**

```bash
# Now that package.json is in place at root
rm -rf ai-harness-cli/  # Clean up old directory if still exists
npm install
```

- [ ] **Step 3: Commit package-lock.json**

```bash
git add package-lock.json
git commit -m "chore: install dependencies at root level"
```

---

### Task 5: Update GitHub Actions Workflow

**What:** Update .github/workflows/publish.yml to use mise and single package structure

**Files:**
- Modify: `.github/workflows/publish.yml`

- [ ] **Step 1: Delete old workflow and create new one**

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*.*.*'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

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

      - name: Verify CLI binary
        run: |
          test -f bin/ah
          test -x bin/ah

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

      - name: Setup Node.js for NPM
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
          test -f dist/index.d.ts
          test -f bin/ah
          test -x bin/ah

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

      - name: Get version from tag
        id: get_version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          name: Release ${{ steps.get_version.outputs.VERSION }}
          draft: false
          prerelease: false
          generate_release_notes: true
          body: |
            Published to NPM: `@piwero/ai-harness-cli@${{ steps.get_version.outputs.VERSION }}`
            
            Install globally:
            ```bash
            npm install -g @piwero/ai-harness-cli
            ```
            
            Install locally in project:
            ```bash
            npm install --save-dev @piwero/ai-harness-cli
            ```
```

- [ ] **Step 2: Commit updated workflow**

```bash
git add .github/workflows/publish.yml
git commit -m "ci: update GitHub Actions to use mise and single package

- Use jdx/mise-action@v2 for Node.js setup
- Run all checks using mise run commands
- Remove working-directory references (single package)
- Update to softprops/action-gh-release@v1
- Add concurrency control to prevent conflicting runs"
```

---

### Task 6: Update .gitignore with Mise

**What:** Ensure .gitignore properly ignores mise-related files but tracks mise.toml

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add mise to .gitignore**

Ensure `.gitignore` includes:

```
# mise local overrides (tracked: mise.toml)
.mise.local.toml
.mise.*.local.toml

# Existing entries...
```

**Note:** We do NOT ignore `mise.toml` itself - that should be committed.

- [ ] **Step 2: Commit updated .gitignore**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for mise"
```

---

### Task 7: Cleanup and Final Verification

**What:** Delete leftover files and verify everything works

- [ ] **Step 1: Remove old root package files**

```bash
# Remove old configuration files
rm -f tsconfig.json.old  # If any backups exist
rm -f jest.config.js.old
rm -f .eslintrc.json.old

# Clean up any old directories that shouldn't exist
rm -rf ai-harness-cli/  # Should be empty now

# Verify structure is correct
ls -la
```

Expected structure:
```
.
├── bin/
├── dist/           # After build
├── src/
├── templates/
├── tests/
├── scripts/
│   └── release.sh
├── .github/
│   └── workflows/
│       └── publish.yml
├── .gitignore
├── .eslintrc.json
├── jest.config.js
├── mise.toml
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json
```

- [ ] **Step 2: Verify mise tasks work**

```bash
# Test each mise task
mise run build
mise run test
mise run lint
mise run typecheck
```

Expected: All tasks complete successfully

- [ ] **Step 3: Verify CLI works**

```bash
# Test the CLI
./bin/ah --version
./bin/ah --help
```

Expected: Shows version and help output

- [ ] **Step 4: Commit any final cleanup**

```bash
git status  # Should be clean
git log --oneline -n 10  # Review commits
```

- [ ] **Step 5: Create summary commit if needed**

```bash
git add -A
git commit -m "refactor: complete monorepo consolidation

- Move CLI to root package
- Add mise.toml with development tasks
- Create release.sh for automated versioning
- Update GitHub Actions for single package
- Consolidate configuration files

BREAKING CHANGE: Package structure changed from monorepo to single package"
```

---

## Verification Checklist

Before considering complete, verify:

- [ ] `mise install` works and installs Node 22
- [ ] `npm install` succeeds
- [ ] `mise run build` compiles TypeScript without errors
- [ ] `mise run test` passes all tests
- [ ] `mise run lint` shows no errors
- [ ] `mise run typecheck` passes
- [ ] `./bin/ah --version` works
- [ ] `./bin/ah init --help` works
- [ ] GitHub Actions workflow syntax is valid (check with actionlint if available)
- [ ] Release script is executable and syntax is valid: `bash -n scripts/release.sh`

---

## Post-Implementation

### Testing the Release Flow

1. **Test release:patch (dry run)**
   ```bash
   # Only run if you're on a feature branch, not main
   # This will create a test tag - delete it after
   git checkout -b test/release-flow
   ./scripts/release.sh patch
   ```

2. **Clean up test tag**
   ```bash
   git push --delete origin v0.1.4  # or whatever version was created
   git tag -d v0.1.4
   git reset --hard HEAD~1
   git branch -D test/release-flow
   ```

### Next Steps After Merge

1. Merge the consolidation branch to main
2. Run first release: `mise run release:patch` to create v0.1.4
3. Monitor GitHub Actions to ensure publishing works
4. Verify package is available on NPM: `npm view @piwero/ai-harness-cli`

---

## Troubleshooting

### Common Issues

**Issue: Mise not installed**
- Install from https://mise.jdx.dev/
- Or use direnv/asdf as fallback

**Issue: Tests fail after move**
- Check that tsconfig.json paths are correct
- Verify Jest configuration is intact
- Run `mise run typecheck` for specific errors

**Issue: CLI binary not working**
- Check `bin/ah` shebang line: `#!/usr/bin/env node`
- Ensure file is executable: `chmod +x bin/ah`
- Check compiled `dist/index.js` exists

**Issue: GitHub Actions fails**
- Check workflow syntax: https://rhysd.github.io/actionlint/
- Verify secrets.NPM_PUBLISH_TOKEN is set in repository settings
- Check mise-action is working in your fork
