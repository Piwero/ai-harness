import * as fs from 'fs-extra';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { verbose, success } from '../utils/logger';
import { ProviderVersion, ProviderManifest, ParsedProviderSpec } from './provider-store';
import { ProviderStore } from './provider-store';

export interface SetupOptions {
  force?: boolean;
  skipVersionCheck?: boolean;
  verbose?: boolean;
}

export interface ProjectInfo {
  name: string;
  description: string;
}

export interface SubstitutionVariables {
  project_name: string;
  project_description: string;
  model: string;
}

export class ProviderScaffolder {
  private providerStore: ProviderStore;

  constructor(private isVerbose = false) {
    this.providerStore = new ProviderStore(isVerbose);
  }

  /**
   * Main entry point for setting up a provider
   */
  async setupProvider(
    projectPath: string,
    providerSpec: ParsedProviderSpec,
    options: SetupOptions = {}
  ): Promise<void> {
    const { provider, components } = providerSpec;
    
    verbose(`Setting up provider ${provider} at ${projectPath}`, this.isVerbose);

    // Load provider
    const providerVersion = this.providerStore.loadProvider(provider);
    
    // Parse project info from .ai.toml
    const projectInfo = this.parseProjectInfo(projectPath);
    
    // Define substitution variables
    const variables: SubstitutionVariables = {
      project_name: projectInfo.name,
      project_description: projectInfo.description,
      model: 'gpt-4o', // Default model, user configures in OpenCode UI
    };

    // Setup directory structure
    await this.setupDirectoryStructure(projectPath, provider, options.force);

    // Copy and process components
    for (const component of components) {
      await this.copyComponent(projectPath, providerVersion, component, variables, options.force);
    }

    // Generate opencode.json configuration
    await this.generateOpencodeConfig(
      projectPath,
      providerVersion,
      components,
      variables,
      options.force
    );

    success(`Provider ${provider} setup complete in .opencode/`);
  }

  /**
   * Parse project information from .ai.toml
   */
  private parseProjectInfo(projectPath: string): ProjectInfo {
    const aiTomlPath = path.join(projectPath, '.ai.toml');
    
    if (!fs.existsSync(aiTomlPath)) {
      // Fallback to directory name
      return {
        name: path.basename(projectPath),
        description: `Project ${path.basename(projectPath)}`,
      };
    }

    try {
      const content = fs.readFileSync(aiTomlPath, 'utf-8');
      const config = TOML.parse(content) as any;
      
      const name = config.project?.name || path.basename(projectPath);
      const description = config.project?.description || 
                          config.harness?.description || 
                          `Project ${name}`;
      
      return { name, description };
    } catch (error) {
      verbose(`Warning: Failed to parse .ai.toml: ${error}`, this.isVerbose);
      return {
        name: path.basename(projectPath),
        description: `Project ${path.basename(projectPath)}`,
      };
    }
  }

  /**
   * Create the .opencode/ directory structure
   */
  private async setupDirectoryStructure(
    projectPath: string,
    provider: string,
    force?: boolean
  ): Promise<void> {
    const opencodePath = path.join(projectPath, '.opencode');

    if (fs.existsSync(opencodePath)) {
      if (!force) {
        throw new Error(
          '.opencode/ directory already exists. Use --force to overwrite.'
        );
      }
      verbose('Removing existing .opencode/ directory', this.isVerbose);
      fs.removeSync(opencodePath);
    }

    fs.ensureDirSync(opencodePath);
    verbose(`Created ${opencodePath}`, this.isVerbose);
  }

  /**
   * Copy a component directory from template to project with variable substitution
   */
  private async copyComponent(
    projectPath: string,
    providerVersion: ProviderVersion,
    component: string,
    variables: SubstitutionVariables,
    force?: boolean
  ): Promise<void> {
    const manifest = providerVersion.manifest;
    
    // Check if component is supported by this provider
    const componentPath = this.getComponentSourcePath(providerVersion, component);
    if (!componentPath) {
      throw new Error(
        `Component '${component}' not supported by provider ${providerVersion.name}`
      );
    }

    const sourcePath = path.join(providerVersion.path, componentPath);
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `Component '${component}' directory not found at ${sourcePath}`
      );
    }

    const targetPath = path.join(projectPath, '.opencode', component);

    // Check if exists and handle force flag
    if (fs.existsSync(targetPath)) {
      if (!force) {
        throw new Error(
          `Component '${component}' already exists. Use --force to overwrite.`
        );
      }
      fs.removeSync(targetPath);
    }

    // Copy and process files
    fs.ensureDirSync(targetPath);
    this.copyAndProcessDirectory(sourcePath, targetPath, variables);

    verbose(`Copied ${component} component to ${targetPath}`, this.isVerbose);
  }

  /**
   * Get the source path for a component from the provider manifest
   */
  private getComponentSourcePath(
    providerVersion: ProviderVersion,
    component: string
  ): string | null {
    const manifest = providerVersion.manifest;
    
    switch (component) {
      case 'agents':
        return manifest.capabilities.agents ? manifest.paths.agents || 'agents/' : null;
      case 'skills':
        return manifest.capabilities.skills ? manifest.paths.skills || 'skills/' : null;
      case 'plugins':
        return manifest.capabilities.plugins ? manifest.paths.plugins || 'plugins/' : null;
      case 'mcp':
        return manifest.capabilities.mcp ? manifest.paths.mcp || 'mcp/' : null;
      default:
        return null;
    }
  }

  /**
   * Recursively copy a directory and substitute variables in file contents
   */
  private copyAndProcessDirectory(
    sourcePath: string,
    targetPath: string,
    variables: SubstitutionVariables
  ): void {
    const entries = fs.readdirSync(sourcePath);

    for (const entry of entries) {
      const sourceFile = path.join(sourcePath, entry);
      const targetFile = path.join(targetPath, entry);
      const stat = fs.statSync(sourceFile);

      if (stat.isDirectory()) {
        fs.ensureDirSync(targetFile);
        this.copyAndProcessDirectory(sourceFile, targetFile, variables);
      } else {
        this.copyAndProcessFile(sourceFile, targetFile, variables);
      }
    }
  }

  /**
   * Copy a single file and substitute variables
   */
  private copyAndProcessFile(
    sourcePath: string,
    targetPath: string,
    variables: SubstitutionVariables
  ): void {
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const processedContent = this.substituteVariables(content, variables);
    fs.writeFileSync(targetPath, processedContent, 'utf-8');
  }

  /**
   * Substitute {{variable_name}} patterns with actual values
   */
  private substituteVariables(
    content: string,
    variables: SubstitutionVariables
  ): string {
    let result = content;
    
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, value);
    }
    
    return result;
  }

  /**
   * Generate the opencode.json configuration file
   */
  private async generateOpencodeConfig(
    projectPath: string,
    providerVersion: ProviderVersion,
    components: string[],
    variables: SubstitutionVariables,
    force?: boolean
  ): Promise<void> {
    const targetPath = path.join(projectPath, '.opencode', 'opencode.json');

    if (fs.existsSync(targetPath) && !force) {
      throw new Error(
        'opencode.json already exists. Use --force to overwrite.'
      );
    }

    // Load template opencode.json
    const templatePath = path.join(providerVersion.path, 'opencode.json');
    let config: any;

    if (fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const processedContent = this.substituteVariables(templateContent, variables);
      config = JSON.parse(processedContent);
    } else {
      // Create minimal config if template doesn't exist
      config = {
        $schema: 'https://opencode.ai/config.json',
        model: variables.model,
      };
    }

    // Filter config based on installed components
    config = this.filterConfigByComponents(config, components);

    // Ensure no disallowed keys are present
    config = this.sanitizeConfig(config);

    fs.writeFileSync(targetPath, JSON.stringify(config, null, 2), 'utf-8');
    verbose(`Generated ${targetPath}`, this.isVerbose);
  }

  /**
   * Filter configuration to only include sections relevant to installed components
   */
  private filterConfigByComponents(config: any, components: string[]): any {
    const filtered: any = {
      $schema: config.$schema || 'https://opencode.ai/config.json',
      model: config.model,
    };

    // Always include tools and instructions if present
    if (config.tools) {
      filtered.tools = config.tools;
    }
    if (config.instructions) {
      filtered.instructions = config.instructions;
    }
    if (config.shell) {
      filtered.shell = config.shell;
    }
    if (config.permission) {
      filtered.permission = config.permission;
    }

    // Only include agent if agents component is installed
    if (components.includes('agents') && config.agent) {
      filtered.agent = config.agent;
    }

    // Note: skills and plugins are auto-discovered by OpenCode from directories
    // We don't include them in config per OpenCode schema

    return filtered;
  }

  /**
   * Remove disallowed keys from config (commands, skills, etc.)
   */
  private sanitizeConfig(config: any): any {
    const disallowedKeys = ['commands', 'skills'];
    const sanitized: any = {};

    for (const [key, value] of Object.entries(config)) {
      if (!disallowedKeys.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
