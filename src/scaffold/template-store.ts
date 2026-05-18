import * as fs from 'fs-extra';
import * as path from 'path';
import { ComponentVersion } from '../types/scaffold';
import { verbose } from '../utils/logger';

export class TemplateStore {
  private bundledTemplatesPath: string;
  private cachePath: string;

  constructor(private isVerbose = false) {
    this.bundledTemplatesPath = path.join(__dirname, '../../templates');
    this.cachePath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ai-harness', 'cache');
  }

  /**
   * Get all available versions for a component
   */
  getComponentVersions(component: string): string[] {
    const bundledVersions = this.getBundledVersions(component);
    const cachedVersions = this.getCachedVersions(component);
    
    const allVersions = new Set([...bundledVersions, ...cachedVersions]);
    return Array.from(allVersions).sort((a, b) => {
      // Simple semver sort
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

  /**
   * Load a specific component version
   */
  loadComponent(component: string, version: string): ComponentVersion {
    verbose(`Loading component ${component}@${version}`, this.isVerbose);
    
    // First check bundled templates
    const bundledPath = path.join(this.bundledTemplatesPath, component, version);
    if (fs.existsSync(bundledPath)) {
      verbose(`Found bundled template at ${bundledPath}`, this.isVerbose);
      return {
        name: component,
        version,
        path: bundledPath,
        description: this.loadDescription(bundledPath),
      };
    }

    // Then check cache
    const cachedPath = path.join(this.cachePath, component, version);
    if (fs.existsSync(cachedPath)) {
      verbose(`Found cached template at ${cachedPath}`, this.isVerbose);
      return {
        name: component,
        version,
        path: cachedPath,
        description: this.loadDescription(cachedPath),
      };
    }

    throw new Error(`Component ${component}@${version} not found`);
  }

  /**
   * Check if a component version is bundled
   */
  isBundled(component: string, version: string): boolean {
    const bundledPath = path.join(this.bundledTemplatesPath, component, version);
    return fs.existsSync(bundledPath);
  }

  /**
   * Get the latest version of a component
   */
  getLatestVersion(component: string): string | undefined {
    const versions = this.getComponentVersions(component);
    return versions.length > 0 ? versions[0] : undefined;
  }

  /**
   * Check if a component exists (any version)
   */
  hasComponent(component: string): boolean {
    return this.getComponentVersions(component).length > 0;
  }

  /**
   * Check if a provider exists with at least one version
   * Providers live in templates/<provider>/ directories
   */
  hasProvider(name: string): boolean {
    const providerPath = path.join(this.bundledTemplatesPath, name);
    
    if (!fs.existsSync(providerPath)) {
      return false;
    }

    const entries = fs.readdirSync(providerPath);
    return entries.some(entry => {
      const fullPath = path.join(providerPath, entry);
      return fs.statSync(fullPath).isDirectory() && this.isValidVersion(entry);
    });
  }

  /**
   * Get list of all available components
   */
  getAvailableComponents(): string[] {
    const components = new Set<string>();

    // Check bundled
    if (fs.existsSync(this.bundledTemplatesPath)) {
      const entries = fs.readdirSync(this.bundledTemplatesPath);
      for (const entry of entries) {
        const fullPath = path.join(this.bundledTemplatesPath, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          components.add(entry);
        }
      }
    }

    // Check cache
    if (fs.existsSync(this.cachePath)) {
      const entries = fs.readdirSync(this.cachePath);
      for (const entry of entries) {
        const fullPath = path.join(this.cachePath, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          components.add(entry);
        }
      }
    }

    return Array.from(components).sort();
  }

  private getBundledVersions(component: string): string[] {
    const componentPath = path.join(this.bundledTemplatesPath, component);
    if (!fs.existsSync(componentPath)) return [];

    const entries = fs.readdirSync(componentPath);
    return entries.filter(entry => {
      const fullPath = path.join(componentPath, entry);
      return fs.statSync(fullPath).isDirectory() && this.isValidVersion(entry);
    });
  }

  private getCachedVersions(component: string): string[] {
    const componentPath = path.join(this.cachePath, component);
    if (!fs.existsSync(componentPath)) return [];

    const entries = fs.readdirSync(componentPath);
    return entries.filter(entry => {
      const fullPath = path.join(componentPath, entry);
      return fs.statSync(fullPath).isDirectory() && this.isValidVersion(entry);
    });
  }

  private isValidVersion(version: string): boolean {
    // Basic semver validation: x.x.x
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  private loadDescription(componentPath: string): string | undefined {
    const readmePath = path.join(componentPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf-8');
      // Return first non-empty line
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          return trimmed;
        }
      }
    }
    return undefined;
  }
}
