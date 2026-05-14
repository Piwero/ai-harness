/**
 * Scaffolding and component management types
 */

export interface ComponentVersion {
  name: string;
  version: string;
  path: string;
  description?: string;
}

export interface ScaffoldMetadata {
  version: string;
  scaffoldedAt: string;
  components: Record<string, ComponentMetadata>;
}

export interface ComponentMetadata {
  version: string;
  files: Record<string, string>; // filepath -> hash
}

export interface MergeContext {
  filePath: string;
  original: string;
  local: string;
  incoming: string;
}

export interface MergeResult {
  action: 'accept' | 'keep' | 'conflict' | 'skip';
  content?: string;
  context?: MergeContext;
}

export interface ProjectConfig {
  projectPath: string;
  hasGit: boolean;
  existingConfig: boolean;
  harnessConfig?: HarnessConfiguration;
}

export interface HarnessConfiguration {
  project: {
    name: string;
    topology: string;
  };
  harness: {
    base: string[];
    runtime: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  message: string;
  file?: string;
  line?: number;
}
