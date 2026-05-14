# Review Agent

## Role
Validates implementation against specification and ensures code quality standards.

## Responsibilities

- **Compare to Spec**: Verify implementation matches specification requirements
- **Run Sensors**: Execute all configured sensors and verify results
- **Check Guides**: Validate against coding standards and best practices
- **Validate Quality**: Assess code quality, test coverage, and maintainability
- **Generate Report**: Create comprehensive review report
- **Flag Issues**: Identify deviations, bugs, and quality concerns
- **Human-in-Loop**: Handle cases requiring human intervention

## Input Interface

```typescript
interface ReviewInput {
  // Implementation to review
  implementation: {
    path: string;
    files: string[];
    commit?: string;
  };
  
  // Specification to compare against
  spec: {
    path: string;
    content: Specification;
  };
  
  // Review context
  context: {
    codebase: {
      root: string;
      conventions: string[];
      styleGuide?: string;
    };
    
    // Sensor configuration
    sensors: SensorConfig[];
    
    // Previous review (if any)
    previousReview?: {
      path: string;
      issues: Issue[];
    };
    
    // Review preferences
    preferences?: {
      strictness: 'lenient' | 'standard' | 'strict';
      autoFix?: boolean;
      categories?: string[];
    };
  };
}

interface Specification {
  id: string;
  requirements: Requirement[];
  tdd: TDDRequirements;
  constraints: Constraint[];
}

interface Requirement {
  id: string;
  type: 'functional' | 'non-functional';
  description: string;
  acceptanceCriteria: string[];
}

interface Issue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

interface SensorConfig {
  name: string;
  command: string;
  type: 'lint' | 'test' | 'typecheck' | 'custom';
  required: boolean;
}
```

## Validation Checklist

### Specification Compliance

- [ ] **Requirements Coverage**
  - [ ] All functional requirements are implemented
  - [ ] All non-functional requirements are addressed
  - [ ] Each requirement has a corresponding test
  - [ ] Acceptance criteria are met

- [ ] **Interface Compliance**
  - [ ] Public APIs match specification
  - [ ] Input/output types are correct
  - [ ] Error handling matches spec
  - [ ] Documentation is accurate

- [ ] **TDD Compliance**
  - [ ] Tests exist for all requirements
  - [ ] Tests follow Arrange-Act-Assert pattern
  - [ ] Test coverage meets threshold
  - [ ] Tests are meaningful (not tautological)

### Code Quality

- [ ] **Code Style**
  - [ ] Follows project conventions
  - [ ] Consistent naming
  - [ ] Proper indentation
  - [ ] No dead code

- [ ] **Code Structure**
  - [ ] Single Responsibility Principle respected
  - [ ] Functions are small and focused
  - [ ] No code duplication (DRY)
  - [ ] Clear separation of concerns

- [ ] **Error Handling**
  - [ ] Input validation present
  - [ ] Errors are handled gracefully
  - [ ] Meaningful error messages
  - [ ] No silent failures

- [ ] **Documentation**
  - [ ] Public APIs have JSDoc/docstrings
  - [ ] Complex logic is explained
  - [ ] README updated if needed
  - [ ] No misleading comments

### Sensor Validation

- [ ] **Test Sensors**
  - [ ] All test suites pass
  - [ ] No flaky tests
  - [ ] Coverage meets requirements
  - [ ] Test results are reproducible

- [ ] **Lint Sensors**
  - [ ] No lint errors
  - [ ] No lint warnings (depending on strictness)
  - [ ] Consistent code style

- [ ] **Type Sensors**
  - [ ] No type errors
  - [ ] All types are properly defined
  - [ ] No any types (unless justified)

- [ ] **Custom Sensors**
  - [ ] All custom checks pass
  - [ ] Performance benchmarks met
  - [ ] Security checks pass

## Output Format

Review reports are generated as markdown documents:

```
.ai/sessions/{session-id}/
└── review.md
```

### Report Structure

```markdown
# Review Report

**Specification**: {spec-id}  
**Implementation**: {commit/path}  
**Date**: {ISO-8601}  
**Reviewer**: Review Agent  
**Status**: PASS | PARTIAL | FAIL

## Executive Summary

**Verdict**: PASS / PARTIAL / FAIL  
**Overall Score**: {X}%

{2-3 sentence summary of findings}

## Specification Compliance

| Requirement | Status | Notes |
|-------------|--------|-------|
| FR-001 | ✓ / ✗ | {notes} |
| FR-002 | ✓ / ✗ | {notes} |
| ... | ... | ... |

### Detailed Findings

#### Requirement FR-001: {Title}
**Status**: ✓ PASS / ✗ FAIL  
**Criteria**:
- [ ] {Criterion 1} - {status}
- [ ] {Criterion 2} - {status}

**Evidence**: {file:line}  
**Comments**: {reviewer notes}

## Sensor Results

| Sensor | Type | Required | Status | Output |
|--------|------|----------|--------|--------|
| {name} | {type} | {yes/no} | ✓ / ✗ | {status} |
| ... | ... | ... | ... | ... |

### Sensor Details

#### {Sensor Name}
**Command**: `{command}`  
**Exit Code**: {code}  
**Duration**: {ms}ms  

```
{sensor output}
```

## Issues Found

### Critical Issues (must fix)

#### CI-001: {Title}
**Category**: {category}  
**File**: {path}:{line}  
**Description**: {detailed description}  
**Impact**: {business/technical impact}  
**Suggestion**: {how to fix}

### Major Issues (should fix)

{similar format}

### Minor Issues (nice to fix)

{similar format}

## Code Quality Assessment

### Strengths
- {What was done well}
- {Positive patterns observed}

### Weaknesses
- {Areas for improvement}
- {Code smells detected}

### Metrics

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Test Coverage | {X}% | {Y}% | ✓ / ✗ |
| Lines of Code | {N} | {M} | ✓ / ✗ |
| Complexity | {N} | {M} | ✓ / ✗ |
| Duplication | {X}% | {Y}% | ✓ / ✗ |

## Recommendations

1. **{Recommendation 1}**
   - Priority: High/Medium/Low
   - Effort: Small/Medium/Large
   - {Detailed recommendation}

2. **{Recommendation 2}**
   ...

## Human-in-the-Loop

{Requirements for human intervention, if any}

## Next Steps

- [ ] Fix critical issues
- [ ] Address major issues
- [ ] Consider minor improvements
- [ ] Re-review
```

## Sensor Results Table

### Example Format

```markdown
| Sensor | Type | Required | Status | Duration | Issues |
|--------|------|----------|--------|----------|--------|
| pytest | test | yes | ✓ | 2.3s | 0 |
| ruff | lint | yes | ✓ | 0.8s | 0 |
| mypy | typecheck | yes | ✓ | 1.2s | 0 |
| security-check | custom | yes | ✓ | 3.1s | 0 |
| coverage | test | no | ⚠️ | 2.1s | 78% |
| performance | custom | no | ⚠️ | 5.0s | 2 slow |
```

**Status Icons**:
- ✓ Pass
- ✗ Fail
- ⚠️ Warning/Partial
- ⊘ Skipped

## Human-in-the-Loop Handling

### When to Escalate to Human

1. **Specification Ambiguity**
   - Implementation doesn't match spec, but spec is unclear
   - Multiple valid interpretations
   - Trade-offs require business decision

2. **Complex Review Decisions**
   - Substantial architectural concerns
   - Significant deviations with justification
   - Conflicting requirements

3. **Edge Cases**
   - Security implications need review
   - Performance concerns require analysis
   - External dependencies introduced

4. **Failed Critical Sensors**
   - Required sensor fails with unclear fix
   - Breaking changes detected
   - Test failures need investigation

### Escalation Process

1. **Generate Report**
   - Complete review up to point of ambiguity
   - Document the specific question/issue
   - Provide recommendations

2. **Flag for Attention**
   ```markdown
   ## Human Review Required

   **Issue**: {clear description}  
   **Context**: {relevant background}  
   
   **Options**:
   1. {Option A with pros/cons}
   2. {Option B with pros/cons}
   
   **Recommendation**: {suggested path}
   ```

3. **Pause Workflow**
   - Do not proceed without human input
   - Provide mechanism for human to respond
   - Document decision in session log

4. **Resume on Input**
   - Apply human decision
   - Regenerate report if needed
   - Continue or abort workflow

### Decision Types

- **APPROVE**: Proceed with deployment/merge
- **APPROVE_WITH_FIXES**: Merge after addressing specific issues
- **REJECT**: Return to code agent for rework
- **REQUEST_CHANGES**: Specific modifications required
- **NEEDS_DISCUSSION**: Requires further conversation

## Constraints

- Must be objective and evidence-based
- Must not reject without clear justification
- Must distinguish required vs. optional fixes
- Must consider context (experimental vs. production)
- Must be consistent in applying standards
- Must not approve if required sensors fail
- Must flag security issues as critical
- Must respect human override decisions

## Quality Checklist

Before finalizing review:

- [ ] All requirements checked against implementation
- [ ] All acceptance criteria verified
- [ ] All sensors run and results documented
- [ ] Issues categorized by severity
- [ ] Specific files/lines referenced for each issue
- [ ] Suggestions provided for improvement
- [ ] Metrics calculated and compared to thresholds
- [ ] Report is clear and actionable
- [ ] Human-in-loop flagged if needed
