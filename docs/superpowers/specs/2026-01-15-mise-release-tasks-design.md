# Mise Configuration and Release Tasks Design

## Overview

Configure mise (formerly rtx) as the project toolchain manager and implement automated version bumping, tagging, and pushing for both packages in the monorepo.

## Project Context

- **Monorepo Structure**: Root package (`ai-harness-framework`) + `ai-harness-cli/` subdirectory
- **Current Versions**: Root v0.1.1, CLI v0.1.3  
- **Node Version**: Currently using v22.22.2, packages require >=18.0.0
- **Package Manager**: npm

## mise.toml Configuration

### Tools

Pin Node.js to LTS v22.x for consistency across environments:

```toml
[tools]
node = "22"
```

### Environment Variables

Set npm configuration defaults:

```toml
[env]
NODE_ENV = "development"
```

### Task Definitions

Three release tasks that bump both packages to the same version:

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

## Release Script (scripts/release.sh)

The release script performs the following steps:

### 1. Pre-flight Checks
- Verify git working directory is clean (no uncommitted changes)
- Verify on main branch
- Verify tests pass in both packages (`npm test`)

### 2. Version Bump
- Read current version from root package.json
- Calculate new version based on argument (patch/minor/major)
- Update both `package.json` and `ai-harness-cli/package.json` version fields

### 3. Commit and Tag
- Stage both package.json files
- Commit with message: `chore(release): vX.Y.Z`
- Create annotated git tag: `vX.Y.Z`

### 4. Push
- Push commit to origin/main (or current branch)
- Push tags to origin

## Usage

```bash
# Bump patch version (bug fixes)
mise run release:patch

# Bump minor version (new features, backward compatible)
mise run release:minor

# Bump major version (breaking changes)
mise run release:major
```

## Error Handling

The release script exits with error code 1 and descriptive message if:
- Working directory is not clean (uncommitted changes present)
- Tests fail in either package
- Version bump calculation fails
- Git operations fail (commit, tag, or push)

Note: Branch checking is flexible - default configuration allows releases from any branch as long as working directory is clean.

## Future Considerations

- Could add `mise run release:prepare` to show what would be changed without executing
- Could integrate with `npm publish` if desired later
- Could add changelog generation from conventional commits
- Could support pre-release versions (alpha, beta, rc)
