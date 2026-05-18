import * as fs from 'fs-extra';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { InitOptions } from '../types/cli';
import { HarnessConfiguration } from '../types/scaffold';
import { TemplateStore } from './template-store';
import { MetadataManager } from './metadata-manager';
import { success, info, verbose } from '../utils/logger';
import { confirm } from '../utils/prompts';
import { ProviderScaffolder } from './provider-scaffolder';
import { ParsedProviderSpec } from './provider-store';

export class ProjectScaffolder {
  private templateStore: TemplateStore;

  constructor(private isVerbose = false) {
    this.templateStore = new TemplateStore(isVerbose);
  }

  /**
   * Initialize a new project with harness framework
   */
  async scaffoldProject(projectPath: string, options: InitOptions): Promise<void> {
    verbose(`Initializing project at ${projectPath}`, this.isVerbose);

    const aiPath = path.join(projectPath, '.ai');
    const aiTomlPath = path.join(projectPath, '.ai.toml');

    // Check if already initialized
    if (fs.existsSync(aiPath) || fs.existsSync(aiTomlPath)) {
      if (!options.force) {
        const overwrite = await confirm(
          'Harness configuration already exists. Overwrite?',
          false
        );
        if (!overwrite) {
          info('Initialization cancelled');
          return;
        }
      }
    }

    // Create .ai/ directory
    fs.ensureDirSync(aiPath);

    // Create .ai.toml
    await this.createAiToml(projectPath, options.template);

    // Add base component
    await this.addComponent(projectPath, 'base', undefined);

    // Initialize metadata
    const metadataManager = new MetadataManager(projectPath, this.isVerbose);
    metadataManager.initMetadata();

    success('Initialized harness framework');
    info('Next steps:');
    info('  1. Customize .ai/harness/base/guides/ for your project');
    info("  2. Run 'ah add typescript' to add TypeScript support");
    info("  3. Run 'ah validate' to check configuration");
  }

  /**
   * Add a harness component to the project
   */
  async addComponent(
    projectPath: string,
    component: string,
    version?: string
  ): Promise<void> {
    verbose(`Adding component ${component} to ${projectPath}`, this.isVerbose);

    // Determine version
    if (!version) {
      const latest = this.templateStore.getLatestVersion(component);
      if (!latest) {
        throw new Error(`Component ${component} not found`);
      }
      version = latest;
    }

    // Load component
    const componentVersion = this.templateStore.loadComponent(component, version);

    // Copy files to project
    const targetPath = path.join(projectPath, '.ai', 'harness', component);
    fs.ensureDirSync(targetPath);
    fs.copySync(componentVersion.path, targetPath);

    // Update .ai.toml
    await this.updateAiToml(projectPath, component, version);

    // Update metadata
    const metadataManager = new MetadataManager(projectPath, this.isVerbose);
    const fileHashes = this.calculateComponentHashes(componentVersion.path, targetPath);
    metadataManager.updateComponent(component, version, fileHashes);

    success(`Added ${component}@${version}`);
  }

  /**
   * Create initial .ai.toml configuration
   */
  private async createAiToml(projectPath: string, topology?: string): Promise<void> {
    const aiTomlPath = path.join(projectPath, '.ai.toml');
    
    const config: HarnessConfiguration = {
      project: {
        name: path.basename(projectPath),
        topology: topology || 'generic',
      },
      harness: {
        base: [],
        runtime: [],
      },
    };

    const tomlContent = TOML.stringify(config as unknown as TOML.JsonMap);
    fs.writeFileSync(aiTomlPath, tomlContent);
    
    verbose(`Created ${aiTomlPath}`, this.isVerbose);
  }

  /**
   * Update .ai.toml with component reference
   */
  private async updateAiToml(
    projectPath: string,
    component: string,
    version: string
  ): Promise<void> {
    const aiTomlPath = path.join(projectPath, '.ai.toml');
    
    if (!fs.existsSync(aiTomlPath)) {
      throw new Error('.ai.toml not found. Run init first.');
    }

    const content = fs.readFileSync(aiTomlPath, 'utf-8');
    const config = TOML.parse(content) as unknown as HarnessConfiguration;

    // Determine if base or runtime component
    const componentRef = `${component}@${version}`;
    
    if (component === 'base') {
      if (!config.harness.base.includes(componentRef)) {
        config.harness.base.push(componentRef);
      }
    } else {
      if (!config.harness.runtime.includes(componentRef)) {
        config.harness.runtime.push(componentRef);
      }
    }

    const tomlContent = TOML.stringify(config as unknown as TOML.JsonMap);
    fs.writeFileSync(aiTomlPath, tomlContent);
    
    verbose(`Updated ${aiTomlPath}`, this.isVerbose);
  }

  /**
   * Calculate hashes for all files in a component
   */
  private calculateComponentHashes(
    sourcePath: string,
    _targetPath: string
  ): Record<string, string> {
    const hashes: Record<string, string> = {};
    
    const files = this.getAllFiles(sourcePath);
    for (const file of files) {
      const relativePath = path.relative(sourcePath, file);
      const content = fs.readFileSync(file, 'utf-8');
      hashes[relativePath] = MetadataManager.calculateHash(content);
    }

    return hashes;
  }

  /**
   * Recursively get all files in a directory
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }
}
