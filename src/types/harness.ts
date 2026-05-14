export interface HarnessConfig {
  project: {
    name: string;
    topology: string;
  };
  harness: {
    base: string[];
    runtime: string[];
  };
}

export interface HarnessComponent {
  harness: {
    name: string;
    version: string;
    description: string;
    dependencies: string[];
  };
  guides: {
    files: string[];
    templates: string[];
  };
  sensors: {
    computational: string[];
    inferential: string[];
  };
  integration: {
    provides: string[];
    requires: string[];
  };
}

export type SensorType = 'computational' | 'inferential';
export type Severity = 'error' | 'warning' | 'info';

export interface Sensor {
  name: string;
  type: SensorType;
  cmd?: string;
  autoFix?: boolean;
  severity: Severity;
  description?: string;
}

export interface SensorIssue {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  severity?: Severity;
  fixable?: boolean;
}

export interface SensorResult {
  sensor: string;
  passed: boolean;
  issues: SensorIssue[];
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface Guide {
  name: string;
  path: string;
  description?: string;
}

export interface AgentTask {
  id: string;
  type: 'spec' | 'code' | 'review';
  spec: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}
