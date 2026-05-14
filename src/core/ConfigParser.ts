import * as fs from 'fs';
import * as path from 'path';
import * as TOML from '@iarna/toml';
import { HarnessConfig } from '../types/harness';

const DEFAULT_CONFIG: HarnessConfig = {
  project: {
    name: 'unnamed',
    topology: 'generic',
  },
  harness: {
    base: ['base'],
    runtime: [],
  },
};

export class ConfigParser {
  parse(configPath: string): HarnessConfig {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const parsed = TOML.parse(content);

    return this.validateAndTransform(parsed);
  }

  parseOrDefault(projectPath: string): HarnessConfig {
    const configPath = path.join(projectPath, '.ai.toml');

    if (!fs.existsSync(configPath)) {
      return DEFAULT_CONFIG;
    }

    try {
      return this.parse(configPath);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Configuration file not found')) {
        return DEFAULT_CONFIG;
      }
      throw error;
    }
  }

  private validateAndTransform(parsed: unknown): HarnessConfig {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Configuration must be an object');
    }

    const config = parsed as Record<string, unknown>;

    const project = config.project as Record<string, unknown> | undefined;
    if (!project || typeof project !== 'object' || project === null) {
      throw new Error('Missing or invalid [project] section in configuration');
    }

    const projectName = project.name as string | undefined;
    if (!projectName || typeof projectName !== 'string') {
      throw new Error('Missing or invalid project.name in configuration');
    }

    const harness = config.harness as Record<string, unknown> | undefined;
    if (!harness || typeof harness !== 'object' || harness === null) {
      throw new Error('Missing or invalid [harness] section in configuration');
    }

    const harnessBase = harness.base as unknown[] | undefined;
    if (!Array.isArray(harnessBase)) {
      throw new Error('Missing or invalid harness.base array in configuration');
    }

    const projectTopology = (project.topology as string) || 'generic';
    const harnessRuntime = (harness.runtime as unknown[]) || [];

    return {
      project: {
        name: projectName,
        topology: projectTopology,
      },
      harness: {
        base: harnessBase as string[],
        runtime: harnessRuntime as string[],
      },
    };
  }
}
