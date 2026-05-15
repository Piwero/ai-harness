import { Command } from 'commander';
import { ListOptions } from '../types/cli';
import { TemplateStore, MetadataManager } from '../scaffold';
import { info, success } from '../utils/logger';

export function createListCommand(): Command {
  const command = new Command('list')
    .description('List harness components')
    .option('-a, --available', 'Show available components')
    .option('-i, --installed', 'Show installed components only')
    .option('-o, --outdated', 'Show outdated components')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (options: ListOptions) => {
      try {
        const projectPath = process.cwd();
        const templateStore = new TemplateStore(options.verbose);
        
        if (options.available) {
          listAvailable(templateStore);
        } else if (options.outdated) {
          await listOutdated(projectPath, templateStore);
        } else {
          // Default: show installed
          await listInstalled(projectPath, templateStore);
        }
      } catch (err) {
        error(`Failed to list: ${err}`);
        process.exit(1);
      }
    });

  return command;
}

function listAvailable(templateStore: TemplateStore): void {
  const components = templateStore.getAvailableComponents();
  
  if (components.length === 0) {
    info('No components available');
    return;
  }

  success('Available components:');
  for (const component of components) {
    const versions = templateStore.getComponentVersions(component);
    const latest = versions[0];
    const componentInfo = templateStore.loadComponent(component, latest);
    console.log(`  ${component}@${latest}`);
    if (componentInfo.description) {
      console.log(`    ${componentInfo.description}`);
    }
    if (versions.length > 1) {
      console.log(`    Other versions: ${versions.slice(1).join(', ')}`);
    }
  }
}

async function listInstalled(
  projectPath: string, 
  templateStore: TemplateStore
): Promise<void> {
  const metadataManager = new MetadataManager(projectPath);
  
  if (!metadataManager.hasMetadata()) {
    info('No harness components installed. Run "ah init" first.');
    return;
  }

  const components = metadataManager.getTrackedComponents();
  
  if (components.length === 0) {
    info('No harness components installed');
    return;
  }

  success('Installed components:');
  for (const component of components) {
    const currentVersion = metadataManager.getScaffoldedVersion(component);
    const latestVersion = templateStore.getLatestVersion(component);
    
    let status = '';
    if (latestVersion && currentVersion !== latestVersion) {
      status = ` (latest: ${latestVersion})`;
    }
    
    console.log(`  ${component}@${currentVersion}${status}`);
  }
}

async function listOutdated(
  projectPath: string,
  templateStore: TemplateStore
): Promise<void> {
  const metadataManager = new MetadataManager(projectPath);
  
  if (!metadataManager.hasMetadata()) {
    info('No harness components installed');
    return;
  }

  const components = metadataManager.getTrackedComponents();
  const outdated: Array<{ component: string; current: string; latest: string }> = [];

  for (const component of components) {
    const current = metadataManager.getScaffoldedVersion(component);
    const latest = templateStore.getLatestVersion(component);
    
    if (latest && current !== latest) {
      outdated.push({ component, current: current!, latest });
    }
  }

  if (outdated.length === 0) {
    success('All components are up to date');
    return;
  }

  success('Outdated components:');
  for (const { component, current, latest } of outdated) {
    console.log(`  ${component}: ${current} → ${latest}`);
  }
  info('Run "ah upgrade" to update');
}

function error(message: string): void {
  console.error(message);
}
