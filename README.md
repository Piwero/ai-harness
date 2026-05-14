# AI Harness Framework

Composable AI agent harness framework for OpenCode.

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
