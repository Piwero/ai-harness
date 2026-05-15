import * as path from 'path';
import { Command } from 'commander';
import { AddOptions } from '../types/cli';
import { ProjectScaffolder, TemplateStore } from '../scaffold';
import { error, info } from '../utils/logger';

export function createAddCommand(): Command {
  const command = new Command('add')
    .description('Add a harness component to the project')
    .argument('<component>', 'Component name (e.g., typescript, python)')
    .option('-v, --version <version>', 'Specific version to install')
    .option('--verbose', 'Enable verbose output')
    .action(async (component: string, options: AddOptions) => {
      try {
        const projectPath = process.cwd();
        
        // Validate component exists
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
