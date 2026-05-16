# Structured Logging Guide

This guide defines standards for application logging to ensure consistency, searchability, and observability.

## Format

All logs must be structured JSON for machine parsing:

```json
{
  "timestamp": "2024-01-15T09:23:45Z",
  "level": "info",
  "message": "User authentication successful",
  "service": "auth-service",
  "component": "oauth-handler",
  "trace_id": "abc123def456",
  "context": {
    "user_id": "user_789",
    "provider": "google",
    "duration_ms": 245
  }
}
```

## Log Levels

| Level | Use Case |
|-------|----------|
| `DEBUG` | Development details, variable dumps, function entry/exit |
| `INFO` | Normal operations, state changes, successful operations |
| `WARN` | Recoverable issues, deprecated usage, retry attempts |
| `ERROR` | Failures requiring attention, unhandled exceptions |
| `FATAL` | Critical failures causing process termination |

## Required Fields

Every log entry must include:

- `timestamp` - ISO 8601 format with timezone
- `level` - Log level (lowercase)
- `message` - Human-readable description
- `service` - Service or application name

## Optional Fields (Recommended)

- `component` - Subsystem or module
- `trace_id` - Distributed trace identifier
- `span_id` - Span within a trace
- `context` - Structured key-value data relevant to the event
- `error` - Error details (message, stack trace)
- `duration_ms` - Operation timing
- `user_id` - Actor performing the action

## Things to Avoid

- **Never log sensitive data**: passwords, tokens, credit cards, SSNs, PII
- **Never concatenate in message**: use structured context instead of `"User " + userId + " logged in"`
- **Avoid logging secrets**: API keys, connection strings, private keys
- **Don't log at debug in production**: use sampling or disable in prod
- **Avoid logging full request/response bodies**: can be huge and contain secrets

## Examples

### Good

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

### Bad

```json
{
  "timestamp": "2024-01-15T09:23:45Z",
  "level": "info",
  "message": "User example@email.com with password MyP@ss123! logged in successfully"  // DO NOT LOG PASSWORDS
}
```

## Implementation Notes

- Use your language's structured logging library
- Configure centralized log aggregation
- Set up alerts for ERROR and FATAL levels
- Use correlation IDs across service boundaries
