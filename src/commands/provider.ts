import { Command } from 'commander';
import { ProviderScaffolder, SetupOptions as ScaffolderSetupOptions } from '../scaffold/provider-scaffolder';
import { ProviderStore } from '../scaffold/provider-store';
import { info, success, error } from '../utils/logger';

interface ListOptions {
  verbose?: boolean;
}

interface SetupCommandOptions {
  components: string;
  skipConfig: boolean;
  force: boolean;
  verbose: boolean;
}

export function createProviderCommand(): Command {
  const command = new Command('provider')
    .description('Manage provider scaffold templates')
    .addCommand(createListSubcommand())
    .addCommand(createSetupSubcommand());

  return command;
}

function createListSubcommand(): Command {
  return new Command('list')
    .description('List available provider templates')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (options: ListOptions) => {
      try {
        const providerStore = new ProviderStore(options.verbose);
        const providers = providerStore.getAvailableProviders();

        if (providers.length === 0) {
          info('No provider templates available');
          return;
        }

        success('Available provider templates:');
        for (const name of providers) {
          try {
            const provider = providerStore.loadProvider(name);
            const { manifest } = provider;
            console.log(`  ${name}@${manifest.provider.version}`);
            if (manifest.provider.description) {
              console.log(`    ${manifest.provider.description}`);
            }
            const caps = Object.entries(manifest.capabilities)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(', ');
            if (caps) {
              console.log(`    Capabilities: ${caps}`);
            }
          } catch (err) {
            console.log(`  ${name} (error loading)`);
          }
        }
      } catch (err) {
        error(`Failed to list providers: ${err}`);
        process.exit(1);
      }
    });
}

function createSetupSubcommand(): Command {
  return new Command('setup')
    .description('Setup a provider scaffold (usually OpenCode)')  
    .argument('<provider>', 'Provider name (e.g., opencode)')
    .option('-c, --components <list>', 'Comma-separated list of components (agents,skills,plugins,mcp)', 'agents')
    .option('--skip-config', 'Skip configuration file generation')
    .option('-f, --force', 'Overwrite existing files')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (provider: string, options: SetupCommandOptions) => {
      try {
        const projectPath = process.cwd();
        const providerStore = new ProviderStore(options.verbose);

        if (!providerStore.hasProvider(provider)) {
          error(`Provider '${provider}' not found`);
          info(`Run 'ah provider list' to see available providers`);
          process.exit(1);
        }

        const components = options.components ? options.components.split(',').map(c => c.trim()) : ['agents'];
        const providerSpec = { provider, components };

        const setupOptions: ScaffolderSetupOptions = {
          force: options.force,
          verbose: options.verbose
        };

        const scaffolder = new ProviderScaffolder(options.verbose);
        await scaffolder.setupProvider(projectPath, providerSpec, setupOptions);
      } catch (err) {
        error(`Failed to setup provider: ${err}`);
        process.exit(1);
      }
    });
}
