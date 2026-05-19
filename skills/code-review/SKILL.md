---
name: code-review
description: Review code for correctness, quality, security, and spec compliance. Produces a structured report without making direct changes.
license: MIT
compatibility: opencode
---

## What I do

Perform a structured code review covering:

- **Correctness** — Logic errors, edge cases, off-by-ones, null handling
- **Spec compliance** — Implementation matches acceptance criteria
- **Security** — Injection, auth gaps, secrets in code, unsafe deserialization
- **Performance** — N+1 queries, unnecessary allocations, blocking calls
- **Maintainability** — Naming clarity, function length, coupling, duplication
- **Test coverage** — Missing test cases, weak assertions, untested branches

## When to use me

Use this skill after implementation is complete and before merging. I do not edit files — I produce a prioritised findings report only.

## Output format

```
## Review Summary
Status: APPROVED | CHANGES REQUESTED

## Critical (must fix)
- [file:line] Description of issue

## Major (should fix)
- [file:line] Description of issue

## Minor (optional)
- [file:line] Suggestion

## Test coverage gaps
- Description of missing tests
```

## Rules

- Do not make direct file changes
- Prioritise findings by severity: Critical > Major > Minor
- Reference file and line number for every finding
- Flag spec deviations as Critical
