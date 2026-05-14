/**
 * CLI-specific types and interfaces
 */

export interface CLIOptions {
  verbose?: boolean;
  dryRun?: boolean;
}

export interface InitOptions extends CLIOptions {
  template?: string;
  force?: boolean;
}

export interface AddOptions extends CLIOptions {
  version?: string;
}

export interface UpgradeOptions extends CLIOptions {
  component?: string;
}

export interface ListOptions extends CLIOptions {
  available?: boolean;
  installed?: boolean;
  outdated?: boolean;
}

export interface CommandContext {
  projectPath: string;
  options: CLIOptions;
}
