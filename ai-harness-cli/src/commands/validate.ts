import * as path from 'path';
import * as fs from 'fs-extra';
import { Command } from 'commander';
import * as TOML from '@iarna/toml';
import { CLIOptions } from '../types/cli';
import { HarnessConfiguration, ValidationResult } from '../types/scaffold';
import { success, error, warning, info } from '../utils/logger';

export function createValidateCommand(): Command {
  const command = new Command('validate')
    .description('Validate harness configuration')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (options: CLIOptions & { verbose?: boolean }) => {
      try {
        const projectPath = process.cwd();
        const result = validateProject(projectPath, options.verbose);
        
        if (result.valid) {
          success('Configuration is valid');
          if (result.warnings.length > 0) {
            info('Warnings:');
            result.warnings.forEach(w => warning(w.message));
          }
        } else {
          error('Configuration has errors:');
          result.errors.forEach(e => error(e.message));
          process.exit(1);
        }
      } catch (err) {
        error(`Validation failed: ${err}`);
        process.exit(1);
      }
    });

  return command;
}

function validateProject(projectPath: string, isVerbose?: boolean): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check .ai.toml exists
  const aiTomlPath = path.join(projectPath, '.ai.toml');
  if (!fs.existsSync(aiTomlPath)) {
    result.valid = false;
    result.errors.push({
      message: '.ai.toml not found. Run "ah init" first.',
    });
    return result;
  }

  // Parse .ai.toml
  let config: HarnessConfiguration;
  try {
    const content = fs.readFileSync(aiTomlPath, 'utf-8');
    config = TOML.parse(content) as unknown as HarnessConfiguration;
  } catch (err) {
    result.valid = false;
    result.errors.push({
      message: `Failed to parse .ai.toml: ${err}`,
    });
    return result;
  }

  // Validate required fields
  if (!config.project) {
    result.valid = false;
    result.errors.push({
      message: 'Missing [project] section in .ai.toml',
    });
  } else {
    if (!config.project.name) {
      result.valid = false;
      result.errors.push({
        message: 'Missing project.name in .ai.toml',
      });
    }
    if (!config.project.topology) {
      result.warnings.push({
        message: 'Missing project.topology in .ai.toml (using "generic")',
      });
    }
  }

  if (!config.harness) {
    result.valid = false;
    result.errors.push({
      message: 'Missing [harness] section in .ai.toml',
    });
  } else {
    if (!Array.isArray(config.harness.base)) {
      result.valid = false;
      result.errors.push({
        message: 'harness.base must be an array',
      });
    }
    if (!Array.isArray(config.harness.runtime)) {
      result.valid = false;
      result.errors.push({
        message: 'harness.runtime must be an array',
      });
    }
  }

  // Check .ai/ directory exists
  const aiPath = path.join(projectPath, '.ai');
  if (!fs.existsSync(aiPath)) {
    result.valid = false;
    result.errors.push({
      message: '.ai/ directory not found',
    });
  }

  // Check harness components exist
  const harnessPath = path.join(aiPath, 'harness');
  if (fs.existsSync(harnessPath)) {
    const allComponents = [
      ...(config.harness?.base || []),
      ...(config.harness?.runtime || []),
    ];

    for (const componentRef of allComponents) {
      const componentName = componentRef.split('@')[0];
      const componentPath = path.join(harnessPath, componentName);
      
      if (!fs.existsSync(componentPath)) {
        result.valid = false;
        result.errors.push({
          message: `Component "${componentName}" referenced in .ai.toml but not found at ${componentPath}`,
        });
      } else {
        // Validate component structure
        const harnessTomlPath = path.join(componentPath, 'harness.toml');
        if (!fs.existsSync(harnessTomlPath)) {
          result.warnings.push({
            message: `Component "${componentName}" is missing harness.toml`,
          });
        }
      }
    }

    // Check for orphaned harness directories
    if (fs.existsSync(harnessPath)) {
      const dirs = fs.readdirSync(harnessPath).filter(f => 
        fs.statSync(path.join(harnessPath, f)).isDirectory()
      );
      
      const referencedComponents = allComponents.map(ref => ref.split('@')[0]);
      
      for (const dir of dirs) {
        if (!referencedComponents.includes(dir)) {
          result.warnings.push({
            message: `Orphaned harness directory: ${dir} (not referenced in .ai.toml)`,
          });
        }
      }
    }
  }

  return result;
}
