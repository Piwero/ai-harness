# OpenCode Provider Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenCode provider support to AI Harness CLI, enabling automatic setup of `.opencode/` directory and `opencode.json` configuration based on `.ai.toml` provider declarations.

**Architecture:** Provider templates live in `templates/opencode/1.0.0/` with a manifest-based system (`manifest.toml`). Two new classes handle provider logic: `ProviderStore` loads/parses providers, `ProviderScaffolder` copies components and generates config files. Integration points: `ah init --provider opencode`, `ah add opencode[:components]`, new `ah provider` command.

**Tech Stack:** TypeScript, Commander.js, TOML parsing, @iarna/toml, fs-extra

---

## File Structure Overview

### New Files
- `src/types/provider.ts` - Provider-specific type definitions
- `src/scaffold/provider-store.ts` - Load and parse provider manifests
- `src/scaffold/provider-scaffolder.ts` - Copy components and generate configs
- `src/commands/provider.ts` - New `ah provider` command
- `templates/opencode/1.0.0/` - Provider template directory structure
  - `manifest.toml` - Provider capabilities definition
  - `opencode.json` - Config template with variable substitution
  - `agents/` - Agent markdown files
  - `skills/` - Skill markdown files
  - `commands/` - Command markdown files

### Modified Files
- `src/types/scaffold.ts` - Add `agentProviders` to HarnessConfiguration
- `src/types/cli.ts` - Add provider options to InitOptions, AddOptions; add ProviderOptions
- `src/commands/init.ts` - Add --provider flag and provider setup call
- `src/commands/add.ts` - Support provider component syntax (opencode:agents)
- `src/scaffold/project-scaffolder.ts` - Integrate provider setup after component installation
- `src/scaffold/template-store.ts` - Add hasProvider method
- `src/commands/index.ts` - Export provider command
- `src/index.ts` - Register provider command

### Test Files
- `tests/unit/provider-store.test.ts` - Unit tests for ProviderStore
- `tests/unit/provider-scaffolder.test.ts` - Unit tests for ProviderScaffolder
- `tests/integration/provider.test.ts` - Integration tests for provider commands

### Documentation
- `README.md` - Add provider syntax examples and quickstart
- `AGENTS.md` - Update with provider architecture notes

---

## Phase 1: Foundation - Types and Template Structure

### Task 1: Create Provider Type Definitions

**Files:**
- Create: `src/types/provider.ts`

- [ ] **Step 1: Write provider type definitions**

```typescript
/**
 * Provider-specific types for OpenCode and future providers
 */

export interface AgentProvider {
  name: string;
  version: string;
  components: string[];
}

export interface ProviderManifest {
  provider: {
    name: string;
    version: string;
    description: string;
  };
  components: Record<string, {
    path: string;
    description: string;
  }>;
  outputs: {
    directories: string[];
    config_files: string[];
  };
  configuration: {
    template: string;
    variables: string[];
  };
}

export interface ParsedProviderSpec {
  name: string;
  components: string[];
}

export interface ProviderOptions {
  components?: string[];
  skipConfig?: boolean;
  force?: boolean;
  verbose?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/provider.ts
git commit -m "feat(types): add provider type definitions"
```

---

### Task 2: Update CLI Types

**Files:**
- Modify: `src/types/cli.ts`

- [ ] **Step 1: Add provider options to InitOptions**

Add to InitOptions interface:
```typescript
export interface InitOptions extends CLIOptions {
  template?: string;
  force?: boolean;
  provider?: string;        // NEW: Initial provider to setup
}
```

- [ ] **Step 2: Add provider options to AddOptions**

Add to AddOptions interface:
```typescript
export interface AddOptions extends CLIOptions {
  version?: string;
  provider?: string;        // NEW: Auto-setup provider after adding
}
```

- [ ] **Step 3: Add ProviderOptions interface**

Add after ListOptions:
```typescript
export interface ProviderOptions extends CLIOptions {
  components?: string[];    // Specific components to install
  skipConfig?: boolean;     // Skip config file generation
  force?: boolean;          // Overwrite existing
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/cli.ts
git commit -m "feat(types): add provider options to CLI types"
```

---

### Task 3: Update Scaffold Types

**Files:**
- Modify: `src/types/scaffold.ts`

- [ ] **Step 1: Add agentProviders to HarnessConfiguration**

Add to HarnessConfiguration interface:
```typescript
export interface HarnessConfiguration {
  project: {
    name: string;
    topology: string;
  };
  harness: {
    base: string[];
    runtime: string[];
  };
  agentProviders?: {        // NEW
    providers: string[];
    opencode?: {
      components?: string[];
      skipJson?: boolean;
    };
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/scaffold.ts
git commit -m "feat(types): add agentProviders to HarnessConfiguration"
```

---

### Task 4: Create Provider Template Structure

**Files:**
- Create: `templates/opencode/1.0.0/manifest.toml`
- Create: `templates/opencode/1.0.0/opencode.json`
- Create: `templates/opencode/1.0.0/agents/code-agent.md`
- Create: `templates/opencode/1.0.0/skills/brainstorming.md`
- Create: `templates/opencode/1.0.0/commands/explain.md`

- [ ] **Step 1: Create manifest.toml**

```toml
[provider]
name = "opencode"
version = "1.0.0"
description = "OpenCode agent provider with agents, skills, and commands"

[components]
agents = { path = "agents/", description = "Agent definitions" }
skills = { path = "skills/", description = "Reusable skills" }
commands = { path = "commands/", description = "Custom slash commands" }

[outputs]
directories = [".opencode/"]
config_files = ["opencode.json"]

[configuration]
template = "opencode.json"
variables = ["project_name", "project_description", "model"]
```

- [ ] **Step 2: Create opencode.json template**

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "{{model}}",
  "agent": {
    "code-reviewer": {
      "description": "Code reviewer agent for {{project_name}}",
      "model": "{{model}}",
      "prompt": "You are a code reviewer for {{project_name}}. Focus on quality, security, and best practices."
    }
  },
  "tools": {
    "read": true,
    "edit": true,
    "write": true,
    "bash": true
  },
  "instructions": [
    ".ai/instructions/project.md",
    ".ai/instructions/conventions.md"
  ],
  "permission": {
    "edit": "ask",
    "bash": "ask",
    "write": "allow"
  }
}
```

**Important Notes:**
- `$schema` is required for validation and IDE autocomplete
- `model` uses placeholder `{{model}}` - user selects their preferred model in OpenCode UI
- Agents are defined under `agent` key (singular), not `agents`
- `commands` field in config auto-discovers files from `.opencode/commands/` - no need to explicitly list
- `skills` field in config auto-discovers files from `.opencode/skills/` - no need to explicitly list
- `instructions` is an array of file paths (glob patterns supported)

- [ ] **Step 3: Create sample agent file**

Create templates/opencode/1.0.0/agents/code-agent.md:
```markdown
# Code Agent

You are a code review agent. Help developers write better code.

## Capabilities

- Review pull requests
- Suggest improvements
- Identify bugs and issues
```

- [ ] **Step 4: Create sample skill file**

Create templates/opencode/1.0.0/skills/brainstorming.md:
```markdown
# Skill: Brainstorming

Help turn ideas into designs through collaborative dialogue.

## Workflow

1. Understand the problem
2. Ask clarifying questions
3. Propose approaches
4. Present design for approval
```

- [ ] **Step 5: Create sample command file**

Create templates/opencode/1.0.0/commands/explain.md:
```markdown
# Command: /explain

Explain the selected code or file.

## Usage

Select code and type `/explain` to get a detailed explanation.
```

- [ ] **Step 6: Commit template structure**

```bash
git add templates/opencode/
git commit -m "feat(templates): add opencode provider template structure"
```

---

## Phase 2: Core Provider Logic

### Task 5: Implement ProviderStore

**Files:**
- Create: `src/scaffold/provider-store.ts`
- Test: `tests/unit/provider-store.test.ts`

- [ ] **Step 1: Read reference files**

Read: `src/scaffold/template-store.ts` for existing patterns

- [ ] **Step 2: Write ProviderStore class**

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { ProviderManifest, ParsedProviderSpec } from '../types/provider';
import { verbose } from '../utils/logger';

export class ProviderStore {
  private templatesDir: string;

  constructor(private isVerbose = false) {
    this.templatesDir = path.join(__dirname, '..', '..', 'templates');
  }

  /**
   * Load provider manifest
   */
  loadProvider(name: string, version?: string): ProviderManifest {
    const providerVersion = version || this.getLatestVersion(name);
    if (!providerVersion) {
      throw new Error(`Provider ${name} not found`);
    }

    const manifestPath = path.join(
      this.templatesDir,
      name,
      providerVersion,
      'manifest.toml'
    );

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Provider manifest not found: ${manifestPath}`);
    }

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = TOML.parse(content) as unknown as ProviderManifest;
    
    verbose(`Loaded provider ${name}@${providerVersion}`, this.isVerbose);
    return manifest;
  }

  /**
   * Check if provider exists
   */
  hasProvider(name: string): boolean {
    const providerPath = path.join(this.templatesDir, name);
    return fs.existsSync(providerPath);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }

    return fs.readdirSync(this.templatesDir)
      .filter(dir => {
        const providerPath = path.join(this.templatesDir, dir);
        return fs.statSync(providerPath).isDirectory() && 
               this.isValidProvider(dir);
      });
  }

  /**
   * Check if directory is a valid provider
   */
  private isValidProvider(name: string): boolean {
    try {
      const version = this.getLatestVersion(name);
      if (!version) return false;
      
      const manifestPath = path.join(
        this.templatesDir,
        name,
        version,
        'manifest.toml'
      );
      return fs.existsSync(manifestPath);
    } catch {
      return false;
    }
  }

  /**
   * Get latest version of a provider
   */
  getLatestVersion(name: string): string | null {
    const providerPath = path.join(this.templatesDir, name);
    if (!fs.existsSync(providerPath)) {
      return null;
    }

    const versions = fs.readdirSync(providerPath)
      .filter(dir => {
        const versionPath = path.join(providerPath, dir);
        return fs.statSync(versionPath).isDirectory();
      })
      .sort((a, b) => this.compareVersions(b, a));

    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    return 0;
  }

  /**
   * Parse provider specification
   * Supports: "opencode", "opencode:agents", "opencode:agents,skills"
   */
  parseProviderSpec(spec: string): ParsedProviderSpec {
    const parts = spec.split(':');
    const name = parts[0];
    
    if (parts.length === 1) {
      return { name, components: [] };
    }
    
    const components = parts[1].split(',').map(c => c.trim());
    return { name, components };
  }

  /**
   * Get provider path
   */
  getProviderPath(name: string, version?: string): string {
    const providerVersion = version || this.getLatestVersion(name);
    if (!providerVersion) {
      throw new Error(`Provider ${name} not found`);
    }
    return path.join(this.templatesDir, name, providerVersion);
  }
}
```

- [ ] **Step 3: Write unit test**

Create tests/unit/provider-store.test.ts:
```typescript
import { ProviderStore } from '../../src/scaffold/provider-store';

describe('ProviderStore', () => {
  let store: ProviderStore;

  beforeEach(() => {
    store = new ProviderStore();
  });

  describe('parseProviderSpec', () => {
    it('should parse simple provider name', () => {
      const result = store.parseProviderSpec('opencode');
      expect(result).toEqual({ name: 'opencode', components: [] });
    });

    it('should parse provider with single component', () => {
      const result = store.parseProviderSpec('opencode:agents');
      expect(result).toEqual({ name: 'opencode', components: ['agents'] });
    });

    it('should parse provider with multiple components', () => {
      const result = store.parseProviderSpec('opencode:agents,skills');
      expect(result).toEqual({ 
        name: 'opencode', 
        components: ['agents', 'skills'] 
      });
    });
  });

  describe('hasProvider', () => {
    it('should return true for existing provider', () => {
      expect(store.hasProvider('opencode')).toBe(true);
    });

    it('should return false for non-existent provider', () => {
      expect(store.hasProvider('nonexistent')).toBe(false);
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version for existing provider', () => {
      const version = store.getLatestVersion('opencode');
      expect(version).toBe('1.0.0');
    });

    it('should return null for non-existent provider', () => {
      const version = store.getLatestVersion('nonexistent');
      expect(version).toBeNull();
    });
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- tests/unit/provider-store.test.ts
```
Expected: Tests should pass (after the template files are created)

- [ ] **Step 5: Commit**

```bash
git add src/scaffold/provider-store.ts tests/unit/provider-store.test.ts
git commit -m "feat(scaffold): implement ProviderStore class with tests"
```

---

### Task 6: Implement ProviderScaffolder

**Files:**
- Create: `src/scaffold/provider-scaffolder.ts`
- Test: `tests/unit/provider-scaffolder.test.ts`

- [ ] **Step 1: Write ProviderScaffolder class**

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import { ProviderStore } from './provider-store';
import { ProviderOptions, ParsedProviderSpec } from '../types/provider';
import { HarnessConfiguration } from '../types/scaffold';
import { success, info, verbose, error } from '../utils/logger';
import * as TOML from '@iarna/toml';

export class ProviderScaffolder {
  private providerStore: ProviderStore;

  constructor(private isVerbose = false) {
    this.providerStore = new ProviderStore(isVerbose);
  }

  /**
   * Setup provider based on specification
   */
  async setupProvider(
    projectPath: string,
    providerSpec: string,
    options: ProviderOptions = {}
  ): Promise<void> {
    const parsed = this.providerStore.parseProviderSpec(providerSpec);
    const providerName = parsed.name;
    
    verbose(`Setting up provider ${providerName}`, this.isVerbose);

    // Validate provider exists
    if (!this.providerStore.hasProvider(providerName)) {
      const available = this.providerStore.getAvailableProviders();
      throw new Error(
        `Provider "${providerName}" not found. ` +
        `Available providers: ${available.join(', ') || 'none'}`
      );
    }

    // Load provider manifest
    const manifest = this.providerStore.loadProvider(providerName);
    
    // Determine components to install
    const componentsToInstall = this.determineComponents(
      parsed,
      manifest,
      options.components
    );

    // Validate components
    this.validateComponents(componentsToInstall, manifest);

    // Copy components
    const providerPath = this.providerStore.getProviderPath(providerName);
    await this.copyComponents(
      providerPath,
      projectPath,
      componentsToInstall,
      manifest,
      options.force
    );

    // Generate configuration file
    if (!options.skipConfig) {
      await this.generateConfigFile(
        providerPath,
        projectPath,
        manifest,
        componentsToInstall
      );
    }

    success(`Provider ${providerName} installed successfully`);
  }

  /**
   * Determine which components to install
   */
  private determineComponents(
    parsed: ParsedProviderSpec,
    manifest: any,
    explicitComponents?: string[]
  ): string[] {
    // Use explicit components from options first
    if (explicitComponents && explicitComponents.length > 0) {
      return explicitComponents;
    }
    
    // Use components from spec syntax
    if (parsed.components.length > 0) {
      return parsed.components;
    }
    
    // Default: install all available components
    return Object.keys(manifest.components);
  }

  /**
   * Validate component names against manifest
   */
  private validateComponents(components: string[], manifest: any): void {
    const validComponents = Object.keys(manifest.components);
    const invalid = components.filter(c => !validComponents.includes(c));
    
    if (invalid.length > 0) {
      throw new Error(
        `Invalid components: ${invalid.join(', ')}. ` +
        `Valid components: ${validComponents.join(', ')}`
      );
    }
  }

  /**
   * Copy component files to project
   */
  private async copyComponents(
    sourcePath: string,
    projectPath: string,
    components: string[],
    manifest: any,
    force = false
  ): Promise<void> {
    for (const component of components) {
      const componentConfig = manifest.components[component];
      if (!componentConfig) continue;

      const sourceDir = path.join(sourcePath, componentConfig.path);
      const targetDir = path.join(
        projectPath,
        manifest.outputs.directories[0],
        componentConfig.path
      );

      // Check if exists
      if (fs.existsSync(targetDir) && !force) {
        info(`Component ${component} already exists. Use --force to overwrite.`);
        continue;
      }

      // Create directory and copy files
      fs.ensureDirSync(targetDir);
      
      if (fs.existsSync(sourceDir)) {
        fs.copySync(sourceDir, targetDir);
        verbose(`Copied ${component} to ${targetDir}`, this.isVerbose);
      }
    }
  }

  /**
   * Generate configuration file with variable substitution
   */
  private async generateConfigFile(
    providerPath: string,
    projectPath: string,
    manifest: any,
    installedComponents: string[]
  ): Promise<void> {
    const templateFile = manifest.configuration.template;
    const templatePath = path.join(providerPath, templateFile);
    
    if (!fs.existsSync(templatePath)) {
      verbose(`Config template not found: ${templatePath}`, this.isVerbose);
      return;
    }

    // Read project configuration for variables
    const aiTomlPath = path.join(projectPath, '.ai.toml');
    let variables: Record<string, string> = {};
    
    if (fs.existsSync(aiTomlPath)) {
      const content = fs.readFileSync(aiTomlPath, 'utf-8');
      const config = TOML.parse(content) as unknown as HarnessConfiguration;
      variables = {
        project_name: config.project?.name || 'project',
        topology: config.project?.topology || 'generic'
      };
    }

    // Read and process template
    let templateContent = fs.readFileSync(templatePath, 'utf-8');
    
    // Filter components in template
    const config = JSON.parse(templateContent);
    const filteredConfig: any = {
      instructions: config.instructions
    };
    
    for (const component of installedComponents) {
      if (config[component]) {
        filteredConfig[component] = config[component];
      }
    }

    // Substitute variables
    let outputContent = JSON.stringify(filteredConfig, null, 2);
    for (const [key, value] of Object.entries(variables)) {
      outputContent = outputContent.replace(
        new RegExp(`{{${key}}}`, 'g'),
        value
      );
    }

    // Write config file
    const configPath = path.join(projectPath, manifest.outputs.config_files[0]);
    fs.writeFileSync(configPath, outputContent);
    
    verbose(`Generated ${configPath}`, this.isVerbose);
  }
}
```

- [ ] **Step 2: Write unit test**

Create tests/unit/provider-scaffolder.test.ts:
```typescript
import { ProviderScaffolder } from '../../src/scaffold/provider-scaffolder';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('ProviderScaffolder', () => {
  let scaffolder: ProviderScaffolder;
  let tempDir: string;

  beforeEach(async () => {
    scaffolder = new ProviderScaffolder();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-test-'));
    
    // Create mock .ai.toml
    fs.writeFileSync(
      path.join(tempDir, '.ai.toml'),
      `[project]\nname = "test-project"\ntopology = "typescript-lib"`
    );
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  describe('setupProvider', () => {
    it('should throw error for non-existent provider', async () => {
      await expect(
        scaffolder.setupProvider(tempDir, 'nonexistent')
      ).rejects.toThrow('Provider "nonexistent" not found');
    });

    it('should throw error for invalid components', async () => {
      await expect(
        scaffolder.setupProvider(tempDir, 'opencode:invalid')
      ).rejects.toThrow('Invalid components');
    });
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npm test -- tests/unit/provider-scaffolder.test.ts
```
Expected: Tests pass

- [ ] **Step 4: Commit**

```bash
git add src/scaffold/provider-scaffolder.ts tests/unit/provider-scaffolder.test.ts
git commit -m "feat(scaffold): implement ProviderScaffolder class with tests"
```

---

## Phase 3: CLI Integration

### Task 7: Update TemplateStore

**Files:**
- Modify: `src/scaffold/template-store.ts`

- [ ] **Step 1: Add hasProvider method**

Add to TemplateStore class (after hasComponent):
```typescript
/**
 * Check if a provider exists
 */
hasProvider(name: string): boolean {
  const providerPath = path.join(this.templatesDir, name);
  if (!fs.existsSync(providerPath)) {
    return false;
  }

  const versions = fs.readdirSync(providerPath)
    .filter(dir => {
      const versionPath = path.join(providerPath, dir);
      return fs.statSync(versionPath).isDirectory();
    });

  return versions.length > 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scaffold/template-store.ts
git commit -m "feat(scaffold): add hasProvider method to TemplateStore"
```

---

### Task 8: Update ProjectScaffolder

**Files:**
- Modify: `src/scaffold/project-scaffolder.ts`

- [ ] **Step 1: Import ProviderScaffolder**

Add import:
```typescript
import { ProviderScaffolder } from './provider-scaffolder';
```

- [ ] **Step 2: Update scaffoldProject signature**

Not needed - options already has optional fields

- [ ] **Step 3: Add provider setup to scaffoldProject**

Add after metadata initialization (around line 52):
```typescript
// Setup providers if specified
if (options.provider) {
  info('Setting up agent provider...');
  const providerScaffolder = new ProviderScaffolder(this.isVerbose);
  await providerScaffolder.setupProvider(projectPath, options.provider);
}
```

- [ ] **Step 4: Add provider to addComponent**

Add to addComponent method after component installation (around line 88):
```typescript
// Setup provider if specified
if (options.provider) {
  info('Setting up agent provider...');
  const providerScaffolder = new ProviderScaffolder(this.isVerbose);
  await providerScaffolder.setupProvider(projectPath, options.provider);
}
```

- [ ] **Step 5: Add provider update to updateAiToml**

Update the updateAiToml method to also handle provider configuration when reading .ai.toml
(Already handled by HarnessConfiguration type extension)

- [ ] **Step 6: Fix import and commit**

```bash
npm run build
# Fix any TypeScript errors

git add src/scaffold/project-scaffolder.ts
git commit -m "feat(scaffold): integrate provider setup in ProjectScaffolder"
```

---

### Task 9: Create Provider Command

**Files:**
- Create: `src/commands/provider.ts`

- [ ] **Step 1: Write provider command**

```typescript
import { Command } from 'commander';
import { ProviderStore } from '../scaffold/provider-store';
import { ProviderScaffolder } from '../scaffold/provider-scaffolder';
import { error, info, success } from '../utils/logger';

export function createProviderCommand(): Command {
  const command = new Command('provider')
    .description('Manage agent providers (opencode, etc.)');

  // List providers
  command
    .command('list')
    .description('List available providers')
    .option('--available', 'Show available providers')
    .option('--installed', 'Show installed providers')
    .action(async (options) => {
      try {
        const providerStore = new ProviderStore();
        const available = providerStore.getAvailableProviders();
        
        if (options.available || (!options.available && !options.installed)) {
          info('Available providers:');
          if (available.length === 0) {
            info('  No providers installed');
          } else {
            available.forEach(p => info(`  - ${p}`));
          }
        }
      } catch (err) {
        error(`Failed to list providers: ${err}`);
        process.exit(1);
      }
    });

  // Setup provider
  command
    .command('setup')
    .description('Setup a provider in the current project')
    .argument('<provider>', 'Provider name (e.g., opencode)')
    .option('--components <list>', 'Comma-separated list of components (agents,skills,commands)')
    .option('--skip-config', 'Skip config file generation')
    .option('--force', 'Overwrite existing files')
    .option('--verbose', 'Enable verbose output')
    .action(async (provider: string, options) => {
      try {
        const projectPath = process.cwd();
        
        // Validate provider exists
        const providerStore = new ProviderStore(options.verbose);
        if (!providerStore.hasProvider(provider)) {
          const available = providerStore.getAvailableProviders();
          error(`Provider "${provider}" not found`);
          info(`Available providers: ${available.join(', ') || 'none'}`);
          process.exit(1);
        }

        const scaffolder = new ProviderScaffolder(options.verbose);
        await scaffolder.setupProvider(projectPath, provider, {
          components: options.components ? options.components.split(',') : undefined,
          skipConfig: options.skipConfig,
          force: options.force
        });
        
        success(`Provider ${provider} setup complete`);
      } catch (err) {
        error(`Failed to setup provider: ${err}`);
        process.exit(1);
      }
    });

  return command;
}
```

- [ ] **Step 2: Export provider command**

Modify src/commands/index.ts to add:
```typescript
export { createProviderCommand } from './provider';
```

- [ ] **Step 3: Register provider command**

Modify src/index.ts to import and add:
```typescript
import {
  createInitCommand,
  createAddCommand,
  createUpgradeCommand,
  createValidateCommand,
  createListCommand,
  createProviderCommand  // NEW
} from './commands';
```

Add after list command:
```typescript
program.addCommand(createProviderCommand());
```

- [ ] **Step 4: Build and test**

```bash
npm run build
```

- [ ] **Step 5: Test provider command**

```bash
node dist/index.js provider list
node dist/index.js provider setup opencode --verbose
```

- [ ] **Step 6: Commit**

```bash
git add src/commands/provider.ts src/commands/index.ts src/index.ts
git commit -m "feat(commands): add ah provider command with list and setup subcommands"
```

---

### Task 10: Update Init Command

**Files:**
- Modify: `src/commands/init.ts`

- [ ] **Step 1: Add provider option**

Add option to command:
```typescript
export function createInitCommand(): Command {
  const command = new Command('init')
    .description('Initialize AI Harness in the current directory')
    .option('-t, --template <name>', 'Project template to use', 'generic')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--provider <name>', 'Agent provider to setup (e.g., opencode)')  // NEW
    .action(async (options: InitOptions) => {
      try {
        const projectPath = process.cwd();
        const scaffolder = new ProjectScaffolder(options.verbose);
        await scaffolder.scaffoldProject(projectPath, options);
      } catch (err) {
        error(`Failed to initialize: ${err}`);
        process.exit(1);
      }
    });

  return command;
}
```

- [ ] **Step 2: Build and test**

```bash
npm run build
```

- [ ] **Step 3: Test init with provider**

```bash
mkdir -p /tmp/test-init && cd /tmp/test-init
node /home/agent/workspace/dist/index.js init --provider opencode --verbose
ls -la .opencode/
cat opencode.json
```

- [ ] **Step 4: Commit**

```bash
git add src/commands/init.ts
git commit -m "feat(init): add --provider flag to ah init command"
```

---

### Task 11: Update Add Command

**Files:**
- Modify: `src/commands/add.ts`

- [ ] **Step 1: Modify to support provider syntax**

```typescript
import { Command } from 'commander';
import { AddOptions } from '../types/cli';
import { ProjectScaffolder, TemplateStore } from '../scaffold';
import { ProviderStore, ProviderScaffolder } from '../scaffold';  // NEW imports
import { error, info } from '../utils/logger';

export function createAddCommand(): Command {
  const command = new Command('add')
    .description('Add a harness component or provider to the project')
    .argument('<component>', 'Component name (e.g., typescript, python, opencode, opencode:agents)')
    .option('-v, --version <version>', 'Specific version to install')
    .option('--verbose', 'Enable verbose output')
    .action(async (component: string, options: AddOptions) => {
      try {
        const projectPath = process.cwd();
        
        // Check if this is a provider
        const providerStore = new ProviderStore(options.verbose);
        const isProvider = providerStore.hasProvider(component.split(':')[0]);
        
        if (isProvider) {
          // Handle provider installation
          const scaffolder = new ProviderScaffolder(options.verbose);
          await scaffolder.setupProvider(projectPath, component);
          return;
        }
        
        // Handle regular component installation (existing logic)
        const templateStore = new TemplateStore(options.verbose);
        if (!templateStore.hasComponent(component)) {
          const available = templateStore.getAvailableComponents();
          error(`Component "${component}" not found`);
          info(`Available components: ${available.join(', ')}`);
          process.exit(1);
        }

        const scaffolder = new ProjectScaffolder(options.verbose);
        await scaffolder.addComponent(projectPath, component, options.version);
      } catch (err) {
        error(`Failed to add component: ${err}`);
        process.exit(1);
      }
    });

  return command;
}
```

- [ ] **Step 2: Update exports**

Modify src/scaffold/index.ts to export new classes:
```typescript
export { ProviderStore } from './provider-store';
export { ProviderScaffolder } from './provider-scaffolder';
```

- [ ] **Step 3: Build and test**

```bash
npm run build
```

- [ ] **Step 4: Test add provider command**

```bash
cd /tmp/test-init
node /home/agent/workspace/dist/index.js add opencode:agents --verbose
ls -la .opencode/agents/
```

- [ ] **Step 5: Commit**

```bash
git add src/commands/add.ts src/scaffold/index.ts
git commit -m "feat(add): support provider syntax in ah add command"
```

---

## Phase 4: Testing and Documentation

### Task 12: Create Integration Tests

**Files:**
- Create: `tests/integration/provider.test.ts`

- [ ] **Step 1: Write integration test**

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const CLI_PATH = path.join(__dirname, '..', '..', 'dist', 'index.js');

describe('Provider Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-integ-'));
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  describe('ah provider list', () => {
    it('should list available providers', () => {
      const result = execSync(`node ${CLI_PATH} provider list`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });
      expect(result).toContain('Available providers');
    });
  });

  describe('ah init --provider opencode', () => {
    it('should initialize project with opencode provider', () => {
      execSync(`node ${CLI_PATH} init --provider opencode`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      // Check .opencode directory exists
      expect(fs.existsSync(path.join(tempDir, '.opencode'))).toBe(true);
      
      // Check opencode.json exists
      expect(fs.existsSync(path.join(tempDir, 'opencode.json'))).toBe(true);
      
      // Check agents directory
      expect(fs.existsSync(path.join(tempDir, '.opencode', 'agents'))).toBe(true);
    });
  });

  describe('ah add opencode:agents', () => {
    it('should add only agents component', () => {
      // First init without provider
      execSync(`node ${CLI_PATH} init`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      // Then add only agents
      execSync(`node ${CLI_PATH} add opencode:agents`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      // Check agents exist
      expect(fs.existsSync(path.join(tempDir, '.opencode', 'agents'))).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm test -- tests/integration/provider.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/integration/provider.test.ts
git commit -m "test(integration): add provider integration tests"
```

---

### Task 13: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update README.md**

Add after the Installation section:

```markdown
## Agent Providers

AI Harness supports multiple AI agent providers through a unified interface.

### OpenCode Provider

Setup OpenCode configuration automatically:

```bash
# Initialize with OpenCode support
ah init --provider opencode

# Or add to existing project
ah add opencode

# Install only specific components
ah add opencode:agents,skills

# Using provider command
ah provider setup opencode
```

This creates:
- `.opencode/` directory with agents, skills, and commands
- `opencode.json` configuration file

### Configuration

Add to your `.ai.toml`:

```toml
[agent-providers]
providers = ["opencode"]

# Optional: Select specific components
[agent-providers.opencode]
components = ["agents", "skills"]
```
```

- [ ] **Step 2: Update AGENTS.md**

Add a new section:

```markdown
## Provider Architecture

The provider system extends AI Harness to support multiple AI tool configurations.

### How Providers Work

1. **Template Structure**: Providers live in `templates/<provider>/<version>/`
2. **Manifest**: Each provider has a `manifest.toml` defining capabilities
3. **Scaffolding**: `ProviderStore` loads manifests, `ProviderScaffolder` copies files
4. **Configuration**: Generates tool-specific config files with variable substitution

### Adding a New Provider

1. Create `templates/<provider>/1.0.0/` directory
2. Add `manifest.toml` with component definitions
3. Add component directories (agents/, skills/, commands/)
4. Add config template
5. Implement provider in `src/scaffold/`

### Provider Commands

- `ah provider list` - Show available providers
- `ah provider setup <name>` - Setup a provider
- `ah init --provider <name>` - Initialize with provider
- `ah add <provider>[:components]` - Add provider or specific components
```

- [ ] **Step 3: Commit documentation**

```bash
git add README.md AGENTS.md
git commit -m "docs: update README and AGENTS with provider documentation"
```

---

### Task 14: Run Full Verification

- [ ] **Step 1: Run all tests**

```bash
mise run ci
```
Expected: All tests pass, build succeeds, no lint errors, typecheck passes

- [ ] **Step 2: Manual integration test**

```bash
# Build
npm run build

# Test provider list
node dist/index.js provider list

# Test init with provider
mkdir -p /tmp/final-test && cd /tmp/final-test
node /home/agent/workspace/dist/index.js init --provider opencode --verbose

# Verify structure
cat opencode.json
ls -la .opencode/
ls -la .opencode/agents/

# Test add selective
node /home/agent/workspace/dist/index.js add opencode:skills --force
```

- [ ] **Step 3: Final verification**

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Test
npm test
```

- [ ] **Step 4: Commit any final fixes**

```bash
git add .
git commit -m "fix: final verification and cleanup"
```

---

## Spec Coverage Checklist

Reviewing against design spec:

- [x] Provider type definitions (Task 1)
- [x] Provider manifest format with manifest.toml (Task 4)
- [x] ProviderStore class with parsing (Task 5)
- [x] ProviderScaffolder with config generation (Task 6)
- [x] `ah init --provider opencode` (Task 10)
- [x] `ah add opencode[:components]` (Task 11)
- [x] `ah provider` command with subcommands (Task 9)
- [x] Variable substitution in config files (Task 6)
- [x] Component filtering (Task 5, 6)
- [x] Error handling for invalid providers/components (Tasks 6, 9)
- [x] README documentation (Task 13)
- [x] AGENTS.md architecture documentation (Task 13)
- [x] Tests for ProviderStore (Task 5)
- [x] Tests for ProviderScaffolder (Task 6)
- [x] Integration tests (Task 12)

---

## Post-Implementation

After all tasks complete:

1. Update the hardcoded version in `src/index.ts` if needed
2. Consider creating example projects with `.ai.toml` configurations
3. Update CHANGELOG.md with new features
4. Tag release with `mise run release_patch`

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-opencode-provider-implementation.md`.**

---

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you like to use?
