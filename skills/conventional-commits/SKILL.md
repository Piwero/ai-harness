---
name: conventional-commits
description: Write git commit messages following the Conventional Commits specification with the correct type, scope, and imperative mood.
license: MIT
compatibility: opencode
---

## What I do

Format git commit messages as:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Refactoring, no behaviour change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, deps, config maintenance |
| `ci` | CI/CD pipeline changes |

## When to use me

Use this skill whenever writing or reviewing a commit message to ensure it follows the project convention.

## Rules

- Use imperative mood: "add" not "added" or "adds"
- Lowercase first letter of description
- No trailing period in summary line
- Limit summary to 72 characters
- Reference issues in footer: `Closes #123`, `Refs #456`
- Mark breaking changes with `!` after type/scope and a `BREAKING CHANGE:` footer

## Examples

```bash
feat(api): add user authentication endpoint
fix(ui): correct button alignment on mobile
docs: update README with setup instructions
feat(auth)!: remove password-based login

BREAKING CHANGE: Password login removed. Use OAuth2 only.
```
