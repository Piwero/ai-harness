# Commit Conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clear and useful history.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, semicolons, etc.) |
| `refactor` | Code refactoring without behavior change |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks (build, deps, config) |
| `ci` | CI/CD changes |

## Scope Guidelines

Use scope to identify the affected area:
- `ui` - User interface components
- `api` - API endpoints or backend logic
- `db` - Database schema or queries
- `auth` - Authentication/authorization
- `docs` - Documentation
- Component-specific: `button`, `form`, `model`, etc.

## Examples

```bash
# Simple commits
feat(api): add user authentication endpoint
fix(ui): correct button alignment on mobile
docs: update README with setup instructions

# With scope and body
feat(auth): implement OAuth2 flow

Adds support for Google and GitHub OAuth2 authentication.
Includes token refresh and session management.

# Breaking change
feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: All v1 endpoints now return 410 Gone.
Migrate to v2 endpoints before 2024-06-01.

# Multiple types in footer
fix(db): resolve connection pool exhaustion

Closes #123
Refs #456
```

## Rules

1. **Use imperative mood**: "add" not "added" or "adds"
2. **Lowercase first letter**: not "Fixed bug"
3. **No trailing period** in summary line
4. **Limit summary** to 72 characters
5. **Reference issues** in footer when applicable
