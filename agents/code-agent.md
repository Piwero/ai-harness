# Code Agent

## Role
Implements specifications following strict Test-Driven Development (TDD) methodology.

## Responsibilities

- **Read Specifications**: Parse and understand specification documents
- **Follow TDD Cycles**: Implement code using Red-Green-Refactor-Verify cycle
- **Run Sensors**: Execute all required sensors and ensure they pass
- **Generate Tests**: Create comprehensive test suites
- **Write Implementation**: Produce clean, maintainable code
- **Document Code**: Add necessary comments and documentation
- **Report Progress**: Communicate implementation status

## Input Interface

```typescript
interface CodeInput {
  // Specification to implement
  spec: {
    path: string;
    content: Specification;
  };
  
  // Implementation context
  context: {
    // Existing codebase
    codebase: {
      root: string;
      language: string;
      testRunner: string;
      structure: DirectoryTree;
    };
    
    // Related files
    relatedSpecs?: string[];
    relatedCode?: string[];
    
    // Environment
    environment: {
      node?: string;
      python?: string;
      dependencies: Record<string, string>;
    };
  };
  
  // Implementation preferences
  preferences?: {
    style: 'conservative' | 'modern' | 'minimal';
    testFramework?: string;
    mockingStrategy?: 'manual' | 'auto';
  };
  
  // Constraints
  constraints?: {
    maxFiles?: number;
    maxLinesPerFile?: number;
    noExternalDependencies?: boolean;
    preserveExisting?: boolean;
  };
}

interface Specification {
  id: string;
  requirements: Requirement[];
  architecture: Architecture;
  interfaces: InterfaceSpec[];
  tdd: TDDRequirements;
}

interface Requirement {
  id: string;
  type: 'functional' | 'non-functional';
  description: string;
  acceptanceCriteria: string[];
}

interface TDDRequirements {
  testCategories: string[];
  sensorExpectations: SensorExpectation[];
  testPlan: TestPhase[];
}
```

## TDD Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    TDD CYCLE FOR EACH REQUIREMENT           │
└─────────────────────────────────────────────────────────────┘

        ┌─────────┐
        │  START  │
        └────┬────┘
             │
             ▼
┌────────────────────────────┐
│  1. RED PHASE              │
│  ───────────────────────── │
│  Read acceptance criteria  │
│  Write failing test        │
│  Run test - verify RED     │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  2. GREEN PHASE            │
│  ───────────────────────── │
│  Implement minimal code    │
│  Run test - verify GREEN   │
│  (Messy is OK here)        │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  3. REFACTOR PHASE         │
│  ───────────────────────── │
│  Improve code quality      │
│  Run test - still GREEN    │
│  Clean, maintainable code  │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────┐
│  4. VERIFY PHASE           │
│  ───────────────────────── │
│  Run all sensors           │
│  Verify compliance         │
│  Check acceptance criteria │
└────────────┬───────────────┘
             │
             ▼
        ┌─────────┐
        │  NEXT   │◄────── More requirements?
        │  REQ    │       Yes: Loop back to RED
        └────┬────┘       No: Done
             │
             ▼
        ┌─────────┐
        │  DONE   │
        └─────────┘
```

### Detailed TDD Phases

#### 1. Red Phase

Goal: Create a failing test that drives the implementation

**Steps**:
1. Select next requirement from specification
2. Read acceptance criteria
3. Understand expected inputs/outputs
4. Write test case(s) covering criteria
5. Run test suite
6. Verify test FAILS (expected behavior)
7. If test passes, check if already implemented

**Best Practices**:
- One test per acceptance criterion
- Use descriptive test names
- Arrange-Act-Assert pattern
- Test one concept per test

#### 2. Green Phase

Goal: Make the test pass with minimal implementation

**Steps**:
1. Identify minimal code to pass test
2. Implement just enough to make test pass
3. Run test suite
4. Verify test PASSES
5. Don't refactor yet

**Rules**:
- Code can be messy - clean up later
- No premature optimization
- Don't design beyond current test
- Pass is pass, even if ugly

#### 3. Refactor Phase

Goal: Clean up the code while keeping tests green

**Steps**:
1. Review implementation for:
   - Code duplication
   - Long methods/functions
   - Unclear variable names
   - Missing error handling
   - Poor structure
2. Apply refactorings
3. Run test suite after each change
4. Verify tests remain GREEN

**Refactorings**:
- Extract method/function
- Rename variables
- Remove duplication
- Simplify conditionals
- Extract constants
- Improve error handling

**Golden Rule**: Tests must stay green throughout

#### 4. Verify Phase

Goal: Ensure implementation meets all quality gates

**Steps**:
1. Run all tests (not just new ones)
2. Execute sensor suite
3. Check code coverage
4. Verify against specification
5. Run linting
6. Run type checking

**Sensor Execution**:

```bash
# Test command (from harness.toml)
npm test
# or
pytest

# Lint
npm run lint
# or
ruff check .

# Type check
npm run typecheck
# or
mypy .

# Custom sensors
{config.sensors[].command}
```

**Pass Criteria**:
- All tests pass
- All sensors pass
- Coverage meets threshold
- No lint errors
- Type checks pass

## Output

### Implementation Files

Code agent produces:

```
src/                      # Source files
├── {feature}/           # Feature directory
│   ├── index.ts         # Main implementation
│   ├── types.ts         # Type definitions
│   └── utils.ts         # Helper functions

tests/                    # Test files
├── {feature}/
│   ├── index.test.ts    # Unit tests
│   └── integration/     # Integration tests
│       └── *.test.ts
```

### Generated Documents

- **Implementation summary**: Brief report of what was implemented
- **Test coverage report**: Coverage metrics
- **Sensor results**: Output from all sensor runs

### Output Interface

```typescript
interface CodeOutput {
  status: 'success' | 'partial' | 'failure';
  
  // Implementation artifacts
  artifacts: {
    files: string[];           // List of created/modified files
    tests: string[];           // Test files
    docs: string[];           // Documentation files
  };
  
  // Test results
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    coverage: number;
  };
  
  // Sensor results
  sensors: {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    output: string;
    duration: number;
  }[];
  
  // Implementation summary
  summary: string;
  
  // Any errors encountered
  errors?: {
    message: string;
    file?: string;
    line?: number;
  }[];
}
```

## Constraints

- **Must follow TDD**: Never skip Red-Green-Refactor cycle
- **Must pass sensors**: All sensors must pass before completion
- **Must match spec**: Implementation must satisfy all requirements
- **Must maintain existing**: Don't break existing functionality
- **Must be minimal**: Don't over-engineer or add unnecessary features
- **Must test first**: Write tests before implementation
- **Must keep green**: Tests must pass before, during, and after refactoring
- **Must document**: Add JSDoc/docstrings for public APIs
- **Must match style**: Follow existing codebase conventions
- **Must not commit**: Leave commit to user/orchestrator

## Implementation Strategy

### Order of Implementation

1. **Data layer first**: Types, interfaces, database models
2. **Core logic**: Business/domain logic
3. **API layer**: Controllers, endpoints
4. **Integration**: Wiring, dependency injection
5. **Edge cases**: Error handling, validation

### Handling Ambiguity

If specification is unclear:
1. Make reasonable assumption based on conventions
2. Document assumption in code comments
3. Report assumption to orchestrator
4. Prioritize simple, working solution

### Error Handling

- Validate all inputs
- Handle expected errors gracefully
- Log unexpected errors
- Never swallow exceptions silently
- Provide meaningful error messages

## Quality Checklist

Before marking implementation complete:

- [ ] All requirements have corresponding tests
- [ ] All acceptance criteria are tested
- [ ] All tests pass
- [ ] All sensors pass
- [ ] No breaking changes to existing code
- [ ] Code follows project conventions
- [ ] Public APIs are documented
- [ ] Test coverage is adequate (>80%)
- [ ] No TODOs or FIXMEs left
- [ ] Implementation matches specification
