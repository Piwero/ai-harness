---
name: tdd
description: Implement features using Test-Driven Development with Red-Green-Refactor cycles. Write failing tests first, then implement minimal code to pass, then refactor.
license: MIT
compatibility: opencode
---

## What I do

Guide implementation through strict TDD cycles:

1. **Red** — Write a failing test for the next requirement
2. **Green** — Write the minimal code to make the test pass
3. **Refactor** — Clean up while keeping tests green
4. **Verify** — Run all sensors (tests, lint, typecheck)

## When to use me

Use this skill when implementing any new feature or bug fix. Call me before writing any production code to ensure tests are written first.

## Rules

- Never write production code before a failing test exists
- Each test must target exactly one acceptance criterion
- Keep tests green throughout the refactor phase
- Run the full test suite after each cycle, not just the new test
- Mark the cycle complete only when all sensors pass

## Cycle checklist

- [ ] Select next requirement / acceptance criterion
- [ ] Write test — run it — confirm it fails (RED)
- [ ] Implement minimal code — run test — confirm it passes (GREEN)
- [ ] Refactor code — run test — confirm still green (REFACTOR)
- [ ] Run full sensor suite — confirm everything passes (VERIFY)
- [ ] Repeat for next requirement
