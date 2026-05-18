import * as fs from 'fs-extra';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { verbose } from '../utils/logger';

export interface ProviderManifest {
  provider: {
    name: string;
    version: string;
    description?: string;
  };
  capabilities: {
    agents?: boolean;
    skills?: boolean;
    plugins?: boolean;
    mcp?: boolean;
  };
  paths: {
    agents?: string;
    skills?: string;
    plugins?: string;
    mcp?: string;
  };
}

export interface ParsedProviderSpec {
  provider: string;
  components: string[];
}

export interface ProviderVersion {
  name: string;
  version: string;
  path: string;
  manifest: ProviderManifest;
}

export class ProviderStore {
  private bundledTemplatesPath: string;
  private cachePath: string;

  constructor(private isVerbose = false) {
    this.bundledTemplatesPath = path.join(__dirname, '../../templates');
    this.cachePath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ai-harness', 'cache');
  }

  /**
   * Load a provider manifest by name and optional version
   */
  loadProvider(name: string, version?: string): ProviderVersion {
    const targetVersion = version || this.getLatestVersion(name);
    
    if (!targetVersion) {
      throw new Error(`Provider ${name} not found: no versions available`);
    }

    verbose(`Loading provider ${name}@${targetVersion}`, this.isVerbose);

    const providerPath = this.getProviderPath(name, targetVersion);
    
    if (!fs.existsSync(providerPath)) {
      throw new Error(`Provider ${name}@${targetVersion} not found at ${providerPath}`);
    }

    const manifestPath = path.join(providerPath, 'manifest.toml');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Provider ${name}@${targetVersion} is missing manifest.toml`);
    }

    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = TOML.parse(manifestContent) as unknown as ProviderManifest;
      
      verbose(`Loaded manifest for ${name}@${targetVersion}`, this.isVerbose);

      // Validate manifest structure
      if (!manifest.provider || !manifest.provider.name || !manifest.provider.version) {
        throw new Error(`Invalid manifest.toml: missing required provider fields`);
      }

      return {
        name,
        version: targetVersion,
        path: providerPath,
        manifest,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse manifest.toml for ${name}@${targetVersion}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if a provider exists (any version)
   */
  hasProvider(name: string): boolean {
    return this.getProviderVersions(name).length > 0;
  }

  /**
   * Get list of all available providers
   */
  getAvailableProviders(): string[] {
    const providers = new Set<string>();

    // Check bundled templates
    if (fs.existsSync(this.bundledTemplatesPath)) {
      const entries = fs.readdirSync(this.bundledTemplatesPath);
      for (const entry of entries) {
        const fullPath = path.join(this.bundledTemplatesPath, entry);
        if (fs.statSync(fullPath).isDirectory() && this.isValidProvider(fullPath)) {
          providers.add(entry);
        }
      }
    }

    // Check cache
    if (fs.existsSync(this.cachePath)) {
      const entries = fs.readdirSync(this.cachePath);
      for (const entry of entries) {
        const fullPath = path.join(this.cachePath, entry);
        if (fs.statSync(fullPath).isDirectory() && this.isValidProvider(fullPath)) {
          providers.add(entry);
        }
      }
    }

    return Array.from(providers).sort();
  }

  /**
   * Get the latest version for a provider
   */
  getLatestVersion(name: string): string | undefined {
    const versions = this.getProviderVersions(name);
    return versions.length > 0 ? versions[0] : undefined;
  }

  /**
   * Parse a provider specification string
   * Syntax: "opencode" or "opencode:agents" or "opencode:agents,skills"
   */
  parseProviderSpec(spec: string): ParsedProviderSpec {
    const parts = spec.split(':');
    const provider = parts[0];
    
    if (!provider) {
      throw new Error(`Invalid provider spec: "${spec}"`);
    }

    const components: string[] = [];
    
    if (parts.length > 1 && parts[1]) {
      components.push(...parts[1].split(',').filter(c => c.length > 0));
    }

    return { provider, components };
  }

  /**
   * Get the full path to a provider directory
   */
  getProviderPath(name: string, version?: string): string {
    const targetVersion = version || this.getLatestVersion(name);
    
    if (!targetVersion) {
      throw new Error(`No versions available for provider ${name}`);
    }

    // Check bundled first
    const bundledPath = path.join(this.bundledTemplatesPath, name, targetVersion);
    if (fs.existsSync(bundledPath)) {
      return bundledPath;
    }

    // Then check cache
    const cachedPath = path.join(this.cachePath, name, targetVersion);
    if (fs.existsSync(cachedPath)) {
      return cachedPath;
    }

    // Return the expected bundled path even if it doesn't exist yet
    return bundledPath;
  }

  private getProviderVersions(name: string): string[] {
    const bundledVersions = this.getBundledVersions(name);
    const cachedVersions = this.getCachedVersions(name);
    
    const allVersions = new Set([...bundledVersions, ...cachedVersions]);
    return Array.from(allVersions).sort((a, b) => {
      // Simple semver sort (descending order)
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return bVal - aVal; // Descending order
      }
      return 0;
    });
  }

  private getBundledVersions(name: string): string[] {
    const providerPath = path.join(this.bundledTemplatesPath, name);
    if (!fs.existsSync(providerPath)) return [];

    const entries = fs.readdirSync(providerPath);
    return entries.filter(entry => {
      const fullPath = path.join(providerPath, entry);
      return fs.statSync(fullPath).isDirectory() && this.isValidVersion(entry);
    });
  }

  private getCachedVersions(name: string): string[] {
    const providerPath = path.join(this.cachePath, name);
    if (!fs.existsSync(providerPath)) return [];

    const entries = fs.readdirSync(providerPath);
    return entries.filter(entry => {
      const fullPath = path.join(providerPath, entry);
      return fs.statSync(fullPath).isDirectory() && this.isValidVersion(entry);
    });
  }

  private isValidVersion(version: string): boolean {
    // Basic semver validation: x.x.x
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  private isValidProvider(providerPath: string): boolean {
    // Check if any valid versions exist with manifest.toml
    if (!fs.existsSync(providerPath)) return false;

    const entries = fs.readdirSync(providerPath);
    return entries.some(entry => {
      const versionPath = path.join(providerPath, entry);
      if (!fs.statSync(versionPath).isDirectory()) return false;
      if (!this.isValidVersion(entry)) return false;
      
      const manifestPath = path.join(versionPath, 'manifest.toml');
      return fs.existsSync(manifestPath);
    });
  }
}
