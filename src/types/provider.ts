/**
 * Provider type definitions for AI Harness CLI
 * Supports providers = ["opencode"] in .ai.toml configuration
 */

export interface ProviderComponent {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface ProviderOutput {
  type: string;
  template: string;
  destination: string;
}

export interface ProviderManifest {
  version: string;
  capabilities: string[];
  components: ProviderComponent[];
  outputs: ProviderOutput[];
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  components: string[];
}

export interface ComponentMapping {
  componentId: string;
  destination: string;
  template: string;
}
