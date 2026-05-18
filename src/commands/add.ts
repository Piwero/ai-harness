import { Command } from 'commander';
import { AddOptions } from '../types/cli';
import { ProjectScaffolder, TemplateStore, ProviderStore, ProviderScaffolder } from '../scaffold';
import { error, info } from '../utils/logger';

export function createAddCommand(): Command {
  const command = new Command('add')
    .description('Add a harness component to the project')
    .argument('<component>', 'Component name (e.g., typescript, python) or provider (e.g., opencode, opencode:agents)')
    .option('-v, --version <version>', 'Specific version to install')
    .option('-f, --force', 'Overwrite existing configuration')
    .option('--verbose', 'Enable verbose output')
    .action(async (component: string, options: AddOptions) => {
      try {
        const projectPath = process.cwd();
        
        // Check if component is a provider (contains ':' or is a known provider name)
        const providerStore = new ProviderStore(options.verbose);
        const providerName = component.split(':')[0];
        const isProvider = providerStore.hasProvider(providerName);
        
        if (isProvider) {
          const scaffolder = new ProviderScaffolder(options.verbose);
          const providerSpec = providerStore.parseProviderSpec(component);
          await scaffolder.setupProvider(projectPath, providerSpec, {
            force: options.force,
            verbose: options.verbose,
          });
          return;
        }
        
        // Validate component exists in templates
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
