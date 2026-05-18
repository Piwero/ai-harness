# AI Harness CLI - Agent Guide

## Commands

Use `mise` for all dev tasks:
- `mise run build` - Compile TypeScript to `dist/`
- `mise run test` - Run Jest tests
- `mise run lint` - ESLint on `src/**/*.ts`
- `mise run typecheck` - `tsc --noEmit`
- `mise run ci` - Runs build → test → lint → typecheck in sequence

## Key Files

- **Entry**: `src/index.ts` → `dist/index.js` (CLI uses Commander)
- **CLI Binary**: `bin/ah` (shebang: `node require('../dist/index.js')`)
- **Package**: `@piwero/ai-harness-cli` published to NPM

## Project Structure

```
src/                      # CLI implementation
  commands/               # init, add, upgrade, validate, list
  scaffold/               # Scaffolding utilities
  types/                  # TypeScript types
  utils/                  # Logger and helpers
tests/
  integration/            # CLI command tests
  unit/                   # Template store, utilities
templates/                # Project templates
  base/1.0.0/             # Base harness components
```

## Configuration

- `mise.toml` defines release tasks: `release_patch`, `release_minor`, `release_major`
- CI: `.github/workflows/publish.yml` runs on version tags `v*.*.*`
- Releases: `scripts/release.sh` bumps version, commits, tags, pushes → triggers CI → publishes to NPM

## Important Notes

- **Never edit `dist/`** - These are build artifacts. Always edit `src/` and run `mise run build`
- **Version constant in src**: Package version in `src/index.ts` is hardcoded at `0.1.0` (update manually after releases)
- **CLI global install**: Published globally as `ah` command: `npm install -g @piwero/ai-harness-cli`

## Release Flow

1. Run `mise run release_patch` (or minor/major) from clean git state
2. Script runs: npm ci → build → test → typecheck → lint → version bump → commit + tag → push
3. GitHub Actions triggers on tag push: tests → verify → publish to NPM → create GitHub release

## Templates

Harness components live in `.ai/harness/` and `templates/`. These are copied to user projects via CLI commands.

## Provider Architecture

AI Harness CLI uses a provider system to scaffold AI agent configurations from different AI platforms (OpenCode, Claude Code, Cursor, etc.).

### How Providers Work

Each provider is defined by:

1. **Templates Directory**: Provider-specific templates in `templates/<provider>/<version>/`
2. **Manifest**: `manifest.json` defines available components and their file mappings
3. ** Scaffolding**: Provider components are copied to user projects at `.ai/harness/<provider>/`

Example provider structure:
```
templates/
  opencode/
    1.0.0/
      manifest.json       # Component definitions
      agents/
        SUBAGENTS.md      # Subagent definitions
      skills/
        README.md         # Skill documentation
      components/
        *.md              # Provider components
```

### Adding a New Provider

1. Create `templates/<provider>/1.0.0/` directory
2. Add `manifest.json` with component definitions:
   ```json
   {
     "version": "1.0.0",
     "components": {
       "agents": ["agents/SUBAGENTS.md"],
       "skills": ["skills/README.md"]
     }
   }
   ```
3. Add template files for each component
4. Update CLI to support the provider in init/add commands

### Provider Commands Reference

| Command | Description |
|---------|-------------|
| `ah init --provider <name>` | Initialize project with provider |
| `ah add <provider>` | Add all provider components |
| `ah add <provider>:<component>` | Add specific component |
| `ah provider setup <name>` | Run provider setup wizard |
| `ah provider list` | List available providers |

Provider templates are automatically discovered at runtime from the `templates/` directory.
