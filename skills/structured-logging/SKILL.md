---
name: structured-logging
description: Add structured JSON logging to code following project standards. Includes correct log levels, required fields, and what never to log.
license: MIT
compatibility: opencode
---

## What I do

Produce structured JSON log statements with the correct fields and log level for the situation.

Required fields in every log entry:

- `timestamp` — ISO 8601 with timezone
- `level` — `debug` | `info` | `warn` | `error` | `fatal`
- `message` — Human-readable description
- `service` — Service or application name

## When to use me

Use this skill when adding logging to new code or reviewing existing log statements for compliance.

## Log level guide

| Level | Use case |
|-------|----------|
| `debug` | Dev details, variable dumps, function entry/exit |
| `info` | Normal operations, state changes, successful outcomes |
| `warn` | Recoverable issues, deprecations, retries |
| `error` | Failures requiring attention, unhandled exceptions |
| `fatal` | Critical failures causing process termination |

## Never log

- Passwords, tokens, API keys, or any secrets
- Full PII (email, SSN, credit card numbers)
- Full request/response bodies (may contain secrets or be too large)
- String-concatenated messages — use structured context fields instead

## Example

```json
{
  "timestamp": "2024-01-15T09:23:45Z",
  "level": "info",
  "message": "Payment processed",
  "service": "payment-service",
  "context": {
    "transaction_id": "tx_123",
    "amount_cents": 4999,
    "currency": "USD",
    "duration_ms": 1200
  }
}
```
