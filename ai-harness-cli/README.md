# AI Harness CLI (ah)

A global CLI tool for initializing and managing AI Harness Framework components in your projects.

## Installation

```bash
npm install -g @piwero/ai-harness-cli
```

## Quick Start

```bash
# Initialize harness in your project
cd your-project
ah init

# Add a language-specific component
ah add typescript

# List installed components
ah list

# Upgrade all components
ah upgrade
```

## Commands

### `ah init`

Initialize AI Harness in the current directory.

```bash
ah init [options]

Options:
  -t, --template <name>  Project template to use (default: "generic")
  -f, --force            Overwrite existing configuration
  -v, --verbose          Enable verbose output
```

This command:
- Creates `.ai/` directory structure
- Scaffolds the base harness component
- Creates `.ai.toml` configuration file
- Tracks scaffolded files in `.ai/.scaffold-metadata.json`

### `ah add <component>`

Add a harness component to your project.

```bash
ah add <component> [options]

Arguments:
  component              Component name (e.g., typescript, python)

Options:
  -v, --version <ver>    Specific version to install
  --verbose              Enable verbose output
```

Example:
```bash
ah add typescript
ah add typescript --version 1.0.0
```

### `ah upgrade [component]`

Upgrade harness components with interactive merge support.

```bash
ah upgrade [component] [options]

Arguments:
  component              Specific component to upgrade (optional, upgrades all if omitted)

Options:
  -d, --dry-run          Preview changes without applying
  -v, --verbose          Enable verbose output
```

When upgrading, the CLI uses a three-way merge algorithm:
- **Auto-accept**: If you haven't modified the file, new version is applied automatically
- **Keep local**: If the file hasn't changed upstream, your local version is preserved
- **Interactive merge**: If both changed, you're prompted to review and resolve conflicts

### `ah validate`

Validate harness configuration.

```bash
ah validate [options]

Options:
  -v, --verbose          Enable verbose output
```

Validates:
- `.ai.toml` syntax and structure
- All referenced components exist
- File structure matches metadata

### `ah list`

List harness components.

```bash
ah list [options]

Options:
  -a, --available        Show available components
  -i, --installed        Show installed components only
  -o, --outdated         Show outdated components
  -v, --verbose          Enable verbose output
```

By default, shows installed components with their current versions and latest available versions.

## Directory Structure

After initialization, your project will have:

```
your-project/
├── .ai/
│   ├── .scaffold-metadata.json    # Tracks scaffolded files
│   └── harness/
│       └── base/                  # Base harness component
│           ├── harness.toml
│           ├── README.md
│           ├── guides/
│           │   ├── commit-conventions.md
│           │   └── logging.md
│           └── sensors/
│               └── git-hooks.md
└── .ai.toml                       # Harness configuration
```

## Configuration

The `.ai.toml` file configures harness components for your project:

```toml
[project]
name = "my-project"
description = "Project description"

[harness]
components = ["base", "typescript"]

[[harness.component]]
name = "base"
version = "1.0.0"

[[harness.component]]
name = "typescript"
version = "1.0.0"
```

## Component Versions

Components are versioned independently. Each project can use different versions:

```bash
# Project A uses typescript 1.0.0
cd project-a
ah add typescript --version 1.0.0

# Project B uses typescript 1.1.0
cd project-b
ah add typescript --version 1.1.0
```

The CLI stores the exact version in `.ai.toml` and `.ai/.scaffold-metadata.json`.

## Upgrade Workflow

When you upgrade components, the CLI preserves your customizations:

1. **Detection**: Compares current files with the original scaffolded versions
2. **Merge Strategy**: 
   - Unmodified files → auto-update to new version
   - Modified files → three-way merge with conflict resolution
3. **Interactive Prompts**: Review changes and choose to accept, keep local, or merge manually
4. **Metadata Update**: Records new file hashes for future upgrades

## Available Components

- **base**: Universal development standards and tooling (commits, logging, git hooks)
- **typescript**: TypeScript-specific harness components

Components are bundled with the CLI and cached locally after first use.

## Development

```bash
cd ai-harness-cli
npm install
npm run build
npm test
npm link  # Link globally for testing
```

## Contributing & Publishing

### For Contributors

```bash
cd ai-harness-cli
npm install
npm run build
npm test
npm link  # Link globally for testing
```

### For Maintainers (Publishing to NPM)

This package is automatically published to NPM via GitHub Actions when a version tag is pushed.

#### Prerequisites

1. **Create NPM Access Token**:
   - Go to https://www.npmjs.com → Login → Profile → Access Tokens → Generate New Token (Classic)
   - Select "Publish" scope
   - Copy the token

2. **Add GitHub Secret**:
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_PUBLISH_TOKEN`
   - Value: Your NPM token from step 1

#### Publishing a New Version

```bash
# In the ai-harness-cli directory
cd ai-harness-cli

# Version bump (patch, minor, or major)
npm version patch   # 0.1.0 → 0.1.1
# or
npm version minor   # 0.1.0 → 0.2.0
# or
npm version major   # 0.1.0 → 1.0.0

# Push the tag to trigger the pipeline
git push
git push --tags
```

The GitHub Actions pipeline will automatically:
1. Run full test suite
2. Build the TypeScript
3. Publish to `@piwero/ai-harness-cli` on NPM
4. Create a GitHub Release

## License

MIT
