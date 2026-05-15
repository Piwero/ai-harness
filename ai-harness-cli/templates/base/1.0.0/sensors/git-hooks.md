# Git Hooks Sensor

Computational sensor for validating git operations against project standards.

## Metadata

```yaml
type: computational
cmd: git-hooks
severity: error
```

## Description

This sensor runs automated checks on git commits to enforce project standards including conventional commits, file patterns, and pre-commit validations.

## Checks Performed

### Pre-commit
- **Trailing whitespace**: Blocks commits with trailing whitespace in changed lines
- **File size**: Warns on files >1MB, blocks >10MB
- **Secrets detection**: Scans for high-entropy strings matching secret patterns
- **Executable bits**: Validates executable permissions on shell scripts

### Commit-msg
- **Conventional commits**: Validates commit message follows `type(scope): description` format
- **Line length**: Ensures subject line ≤72 characters
- **Issue references**: Warns if no issue reference in commit message

### Pre-push
- **Tests pass**: Runs test suite before allowing push
- **Linting**: Ensures code passes linting rules
- **Branch protection**: Validates branch name against naming conventions

## Failure Recovery

### Pre-commit Failures
1. Stage fixes: `git add -u` after fixing issues
2. Retry commit

### Commit-msg Failures
1. Amend message: `git commit --amend`
2. Re-enter corrected message

### Pre-push Failures
1. Fix failing tests or linting issues
2. Amend commit if needed: `git commit --amend --no-edit`
3. Force push if history rewritten: `git push --force-with-lease`

## Bypass (Not Recommended)

Only bypass hooks in emergencies:

```bash
git commit --no-verify  # Skip pre-commit and commit-msg hooks
git push --no-verify    # Skip pre-push hook
```

⚠️ **WARNING**: Bypassing hooks may introduce issues into the codebase. Always run manual verification if you bypass automated checks.
