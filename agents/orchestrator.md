# Orchestrator Agent

## Role
Coordinates workflow, parses configuration, and dispatches tasks to specialized agents within the Harness Framework.

## Responsibilities

- **Configuration Parsing**: Parse and validate `.ai/harness.toml` configuration
- **Harness Loading**: Initialize and load the Harness framework instance
- **Filesystem State Management**: Track and manage filesystem state throughout workflows
- **Agent Dispatch**: Route tasks to appropriate agents (spec, code, review)
- **Workflow Orchestration**: Coordinate the overall software development lifecycle
- **State Persistence**: Maintain workflow state across agent transitions
- **Error Handling**: Gracefully handle failures and provide recovery paths

## Input Interface

```typescript
interface OrchestratorInput {
  // Required configuration
  config: HarnessConfig;
  
  // Workflow context
  context: {
    workDir: string;
    sessionId: string;
    timestamp: Date;
    mode: 'spec' | 'code' | 'review' | 'full';
  };
  
  // Task specification
  task: {
    type: 'spec' | 'code' | 'review';
    description: string;
    requirements?: Requirement[];
    existingSpecPath?: string;
  };
  
  // Optional overrides
  options?: {
    skipSensors?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
  };
}

interface HarnessConfig {
  version: string;
  agents: {
    spec: AgentConfig;
    code: AgentConfig;
    review: AgentConfig;
  };
  sensors: SensorConfig[];
  output: {
    specsDir: string;
    designsDir: string;
    sessionsDir: string;
    sessionsTemplate?: string;
  };
}

interface AgentConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  enabled: boolean;
}

interface SensorConfig {
  name: string;
  command: string;
  type: 'lint' | 'test' | 'typecheck' | 'custom';
  required: boolean;
}
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

1. INITIALIZE
   ┌──────────────┐
   │ Parse Config │◄───── .ai/harness.toml
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │ Validate Env │─────► Error if invalid
   └──────┬───────┘
          │
2. LOAD HARNESS
          ▼
   ┌──────────────┐
   │ Load Harness │
   │   Instance   │
   └──────┬───────┘
          │
3. DISPATCH TO AGENTS
          ▼
   ┌──────────────┐
   │    SPEC      │─────► spec-agent.md
   │ Dispatch     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    CODE      │─────► code-agent.md
   │ Dispatch     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │    REVIEW    │─────► review-agent.md
   │ Dispatch     │
   └──────┬───────┘
          │
4. COORDINATE
          ▼
   ┌──────────────────┐
   │ Manage Handoffs  │
   │ Track State      │
   │ Handle Failures  │
   └──────┬───────────┘
          │
5. FINALIZE
          ▼
   ┌──────────────┐
   │   Output     │─────► .ai/specs/
   │    Results   │      .ai/designs/
   └──────────────┘      .ai/sessions/
```

### Step-by-Step Workflow

1. **Initialize**
   - Read and parse `.ai/harness.toml`
   - Validate configuration schema
   - Check required directories exist
   - Verify sensor configurations

2. **Load Harness**
   - Instantiate Harness with configuration
   - Initialize filesystem state tracker
   - Load agent configs
   - Register sensors

3. **Dispatch to Spec Agent**
   - If task type includes 'spec' or 'full'
   - Pass requirements and context
   - Await specification document
   - Validate output format

4. **Dispatch to Code Agent**
   - If task type includes 'code' or 'full'
   - Pass specification and context
   - Await implementation
   - Collect sensor results

5. **Dispatch to Review Agent**
   - If task type includes 'review' or 'full'
   - Pass implementation and specification
   - Await review report
   - Determine pass/fail status

6. **Coordinate**
   - Manage state transitions between agents
   - Handle agent failures
   - Implement retry logic
   - Update filesystem state

7. **Finalize**
   - Aggregate all outputs
   - Archive session
   - Generate summary report
   - Return control to user

## Output Locations

### Directory Structure

```
.ai/
├── harness.toml          # Configuration
├── specs/                # Specification documents
│   └── {session-id}/
│       └── spec.md
├── designs/              # Design documents
│   └── {session-id}/
│       └── design.md
└── sessions/             # Session archives
    └── {session-id}/
        ├── session.json  # Full session state
        └── transcript.md # Human-readable log
```

### Output Files

- **.ai/specs/**: Contains specification documents created by spec agent
- **.ai/designs/**: Contains design documents (future expansion)
- **.ai/sessions/**: Contains archived sessions with full state and logs

### Session Archive Format

```json
{
  "sessionId": "uuid",
  "timestamp": "ISO-8601",
  "config": {...},
  "tasks": [...],
  "outputs": {
    "spec": "path/to/spec.md",
    "code": "path/to/implementation",
    "review": "path/to/review.md"
  },
  "metrics": {
    "duration": 12345,
    "tokenUsage": {...},
    "sensorResults": [...]
  }
}
```

## Communication Model

### Agent Protocol

```typescript
interface AgentMessage {
  // Message metadata
  id: string;
  timestamp: Date;
  sender: 'orchestrator' | 'spec' | 'code' | 'review';
  recipient: 'orchestrator' | 'spec' | 'code' | 'review';
  
  // Message content
  type: 'task' | 'result' | 'error' | 'query' | 'response';
  payload: unknown;
  
  // Context
  context: {
    sessionId: string;
    workflowStep: number;
    previousMessageId?: string;
  };
}

interface TaskMessage extends AgentMessage {
  type: 'task';
  payload: {
    taskId: string;
    description: string;
    inputs: Record<string, unknown>;
    constraints: string[];
    deadline?: Date;
  };
}

interface ResultMessage extends AgentMessage {
  type: 'result';
  payload: {
    taskId: string;
    status: 'success' | 'partial' | 'failure';
    outputs: Record<string, unknown>;
    artifacts: string[];
    metrics: {
      duration: number;
      tokens?: number;
    };
    errors?: Error[];
  };
}
```

### Communication Patterns

1. **Task Dispatch** (Orchestrator → Agent)
   - Orchestrator sends task message
   - Includes all required inputs
   - Sets deadline if applicable

2. **Progress Updates** (Agent → Orchestrator)
   - Optional progress messages for long tasks
   - Used for timeout handling
   - Logging and transparency

3. **Result Return** (Agent → Orchestrator)
   - Agent completes task
   - Returns status and outputs
   - Lists all created artifacts

4. **Query/Response** (Bidirectional)
   - Agents can query orchestrator
   - Orchestrator can query agents
   - Used for clarification

### Error Handling

- **Task Failure**: Agent returns error, orchestrator logs and possibly retries
- **Timeout**: Orchestrator cancels task and marks as failed
- **Invalid Output**: Orchestrator rejects result, requests correction
- **Internal Errors**: Orchestrator recovers state, informs user

## Constraints

- Must maintain idempotency - running twice produces same results
- Must validate all inputs before dispatch
- Must persist state at each workflow step
- Must handle interrupted workflows gracefully
- Must not leak sensitive information between agents
- Must respect token limits when dispatching to agents
