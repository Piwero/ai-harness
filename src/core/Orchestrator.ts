import * as path from 'path';
import * as fs from 'fs';
import { ConfigParser } from './ConfigParser';
import { SensorRegistry } from './SensorRegistry';
import type {
  HarnessConfig,
  HarnessComponent,
  Guide,
  SensorResult,
} from '../types/harness';

export interface OrchestratorInput {
  projectPath: string;
  userRequest: string;
  existingSpec?: string;
}

export class Orchestrator {
  private projectPath: string;
  private config?: HarnessConfig;
  private components: HarnessComponent[] = [];
  private sensorRegistry: SensorRegistry = new SensorRegistry();
  private initialized = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async init(): Promise<void> {
    const parser = new ConfigParser();
    this.config = parser.parseOrDefault(this.projectPath);

    await this.loadHarnessComponents();
    this.registerSensors();

    this.initialized = true;
  }

  getConfig(): HarnessConfig {
    this.checkInitialized();
    return this.config!;
  }

  getComponents(): HarnessComponent[] {
    this.checkInitialized();
    return [...this.components];
  }

  getSensorRegistry(): SensorRegistry {
    this.checkInitialized();
    return this.sensorRegistry;
  }

  async executeWorkflow(_input: OrchestratorInput): Promise<object> {
    this.checkInitialized();
    // Placeholder for full workflow execution
    return {
      status: 'not_implemented',
      message: 'Workflow execution not yet implemented',
    };
  }

  getGuides(): Guide[] {
    this.checkInitialized();
    const guides: Guide[] = [];

    for (const component of this.components) {
      if (component.guides && component.guides.files) {
        for (const file of component.guides.files) {
          guides.push({
            name: path.basename(file, '.md'),
            path: file,
            description: this.getGuideDescription(file),
          });
        }
      }
    }

    return guides;
  }

  async runSensors(): Promise<SensorResult[]> {
    this.checkInitialized();
    return this.sensorRegistry.executeAll();
  }

  generateMCPTools(): object[] {
    this.checkInitialized();
    return this.sensorRegistry.generateMCPTools();
  }

  private async loadHarnessComponents(): Promise<void> {
    if (!this.config) return;

    const baseComponents = this.config.harness.base || [];
    for (const componentName of baseComponents) {
      await this.loadComponent(componentName);
    }

    const runtimeComponents = this.config.harness.runtime || [];
    for (const componentName of runtimeComponents) {
      await this.loadComponent(componentName);
    }
  }

  private async loadComponent(name: string): Promise<void> {
    const componentPath = path.join(
      this.projectPath,
      '.ai',
      'harness',
      name,
      'harness.toml'
    );

    if (fs.existsSync(componentPath)) {
      try {
        const content = fs.readFileSync(componentPath, 'utf-8');
        const component = this.parseComponentTOML(content, componentPath);
        this.components.push(component);
      } catch (error) {
        console.warn(`Failed to load component ${name}:`, error);
      }
    } else {
      console.warn(`Component ${name} not found at ${componentPath}`);
    }
  }

  private parseComponentTOML(content: string, _sourcePath: string): HarnessComponent {
    const lines = content.split('\n');
    const component: Partial<HarnessComponent> = {};
    let currentSection: string | null = null;
    const sectionContent: Record<string, Record<string, unknown>> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        sectionContent[currentSection] = {};
      } else if (currentSection) {
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex > 0) {
          const key = trimmed.slice(0, equalIndex).trim();
          const value = trimmed.slice(equalIndex + 1).trim();
          sectionContent[currentSection][key] = this.parseTOMLValue(value);
        }
      }
    }

    component.harness = sectionContent['harness'] as HarnessComponent['harness'];
    component.guides = sectionContent['guides'] as HarnessComponent['guides'];
    component.sensors = sectionContent['sensors'] as HarnessComponent['sensors'];
    component.integration = sectionContent['integration'] as HarnessComponent['integration'];

    return component as HarnessComponent;
  }

  private parseTOMLValue(value: string): unknown {
    value = value.trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      if (!inner) return [];
      
      const items: string[] = [];
      let current = '';
      let inString = false;
      
      for (const char of inner) {
        if (char === '"') {
          inString = !inString;
          current += char;
        } else if (char === ',' && !inString) {
          items.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      if (current.trim()) {
        items.push(current.trim());
      }

      return items.map(item => {
        const trimmed = item.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }

  private registerSensors(): void {
    for (const component of this.components) {
      if (component.sensors) {
        this.registerSensorsFromComponent(component);
      }
    }
  }

  private registerSensorsFromComponent(component: HarnessComponent): void {
    const computationalSensors = component.sensors?.computational || [];
    const inferentialSensors = component.sensors?.inferential || [];

    for (const sensorPath of computationalSensors) {
      const fullPath = path.join(
        this.projectPath,
        '.ai',
        'harness',
        component.harness.name,
        sensorPath
      );

      if (fs.existsSync(fullPath)) {
        const sensorName = path.basename(sensorPath, '.md');
        this.sensorRegistry.register({
          name: sensorName,
          type: 'computational',
          severity: 'warning',
          description: `Computational sensor from ${sensorPath}`,
        });
      }
    }

    for (const sensorPath of inferentialSensors) {
      const fullPath = path.join(
        this.projectPath,
        '.ai',
        'harness',
        component.harness.name,
        sensorPath
      );

      if (fs.existsSync(fullPath)) {
        const sensorName = path.basename(sensorPath, '.md');
        this.sensorRegistry.register({
          name: sensorName,
          type: 'inferential',
          severity: 'warning',
          description: `Inferential sensor from ${sensorPath}`,
        });
      }
    }
  }

  private getGuideDescription(filePath: string): string | undefined {
    try {
      const fullPath = path.join(
        this.projectPath,
        '.ai',
        'harness',
        filePath
      );

      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const firstLine = content.split('\n')[0];
        if (firstLine.startsWith('# ')) {
          return firstLine.slice(2).trim();
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  private checkInitialized(): void {
    if (!this.initialized) {
      throw new Error('Orchestrator not initialized. Call init() first.');
    }
  }
}
