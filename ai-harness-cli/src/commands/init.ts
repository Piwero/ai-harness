import * as path from 'path';
import { Command } from 'commander';
import { InitOptions } from '../types/cli';
import { ProjectScaffolder } from '../scaffold';
import { error } from '../utils/logger';

export function createInitCommand(): Command {
  const command = new Command('init')
    .description('Initialize AI Harness in the current directory')
    .option('-t, --template <name>', 'Project template to use', 'generic')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('-v, --verbose', 'Enable verbose output')
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
