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

## Quick Start

```bash
npm install
npm run build
```

## Architecture

The harness framework enables autonomous AI agents through systematic feedback loops:

- **Guides** (Feedforward): Markdown docs, conventions, patterns
- **Sensors** (Feedback): Computational and inferential validators

See `.ai/specs/harness-framework-design.md` for full design.

## Project Structure

```
.ai/
  harness/              # Harness component library
    base/               # Universal components
    typescript/         # TypeScript-specific
    python/             # Python-specific
agents/                 # Agent definitions
src/                    # Core framework implementation
```
