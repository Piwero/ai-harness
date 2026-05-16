import * as path from 'path';
import * as fs from 'fs-extra';
import { Command } from 'commander';
import { UpgradeOptions } from '../types/cli';
import { 
  TemplateStore, 
  MetadataManager, 
  MergeEngine 
} from '../scaffold';
import { 
  error, 
  success, 
  info, 
  warning,
  verbose 
} from '../utils/logger';
import { mergeConflict } from '../utils/prompts';
import { showDiff } from '../utils/diff';

export function createUpgradeCommand(): Command {
  const command = new Command('upgrade')
    .description('Upgrade harness components')
    .argument('[component]', 'Specific component to upgrade')
    .option('-d, --dry-run', 'Preview changes without applying')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (componentName: string | undefined, options: UpgradeOptions) => {
      try {
        const projectPath = process.cwd();
        const metadataManager = new MetadataManager(projectPath, options.verbose);
        const templateStore = new TemplateStore(options.verbose);
        const mergeEngine = new MergeEngine(projectPath, options.verbose);

        // Check if metadata exists
        if (!metadataManager.hasMetadata()) {
          error('No harness metadata found. Run "ah init" first.');
          process.exit(1);
        }

        // Get components to upgrade
        const components = componentName 
          ? [componentName]
          : metadataManager.getTrackedComponents();

        if (components.length === 0) {
          info('No components to upgrade');
          return;
        }

        // Upgrade each component
        for (const component of components) {
          await upgradeComponent(
            projectPath,
            component,
            metadataManager,
            templateStore,
            mergeEngine,
            options
          );
        }
      } catch (err) {
        error(`Failed to upgrade: ${err}`);
        process.exit(1);
      }
    });

  return command;
}

async function upgradeComponent(
  projectPath: string,
  component: string,
  metadataManager: MetadataManager,
  templateStore: TemplateStore,
  mergeEngine: MergeEngine,
  options: UpgradeOptions
): Promise<void> {
  verbose(`Upgrading ${component}`, options.verbose ?? false);

  // Get current and latest versions
  const currentVersion = metadataManager.getScaffoldedVersion(component);
  const latestVersion = templateStore.getLatestVersion(component);

  if (!currentVersion) {
    warning(`Component ${component} not tracked in metadata`);
    return;
  }

  if (!latestVersion) {
    warning(`Component ${component} not found in template store`);
    return;
  }

  if (currentVersion === latestVersion) {
    info(`${component} is already at latest version (${currentVersion})`);
    return;
  }

  info(`Upgrading ${component} from ${currentVersion} to ${latestVersion}`);

  if (options.dryRun) {
    info('Dry run mode - no changes will be applied');
    return;
  }

  // Load old and new component versions
  const oldComponent = templateStore.loadComponent(component, currentVersion);
  const newComponent = templateStore.loadComponent(component, latestVersion);

  // Get all files in the component
  const componentPath = path.join(projectPath, '.ai', 'harness', component);
  const files = getAllFiles(newComponent.path);

  // Track updated hashes for metadata
  const newHashes: Record<string, string> = {};

  // Process each file
  for (const file of files) {
    const relativePath = path.relative(newComponent.path, file);
    const localFilePath = path.join(componentPath, relativePath);
    
    const incomingContent = fs.readFileSync(file, 'utf-8');
    
    // If file doesn't exist locally, it's new
    if (!fs.existsSync(localFilePath)) {
      verbose(`New file: ${relativePath}`, options.verbose ?? false);
      fs.ensureDirSync(path.dirname(localFilePath));
      fs.writeFileSync(localFilePath, incomingContent);
      newHashes[relativePath] = MetadataManager.calculateHash(incomingContent);
      continue;
    }

    // Get original content (from old version)
    const originalFilePath = path.join(oldComponent.path, relativePath);
    let originalContent = '';
    if (fs.existsSync(originalFilePath)) {
      originalContent = fs.readFileSync(originalFilePath, 'utf-8');
    }

    // Get local content
    const localContent = fs.readFileSync(localFilePath, 'utf-8');

    // Determine merge action
    const mergeResult = mergeEngine.determineMergeAction(
      component,
      relativePath,
      originalContent,
      localContent,
      incomingContent
    );

    switch (mergeResult.action) {
      case 'accept':
        verbose(`Auto-accepting ${relativePath}`, options.verbose ?? false);
        fs.writeFileSync(localFilePath, mergeResult.content!);
        newHashes[relativePath] = MetadataManager.calculateHash(mergeResult.content!);
        break;

      case 'keep':
        verbose(`Keeping local ${relativePath}`, options.verbose ?? false);
        newHashes[relativePath] = MetadataManager.calculateHash(mergeResult.content!);
        break;

      case 'conflict': {
        warning(`Conflict in ${relativePath}`);
        const action = await mergeConflict(relativePath, { hasChanges: true });
        
        switch (action) {
          case 'accept':
            fs.writeFileSync(localFilePath, incomingContent);
            newHashes[relativePath] = MetadataManager.calculateHash(incomingContent);
            break;
          case 'keep':
            newHashes[relativePath] = MetadataManager.calculateHash(localContent);
            break;
          case 'diff': {
            showDiff(localContent, incomingContent, 'current', 'incoming');
            // Re-prompt after showing diff
            const reAction = await mergeConflict(relativePath, { hasChanges: true });
            if (reAction === 'accept') {
              fs.writeFileSync(localFilePath, incomingContent);
              newHashes[relativePath] = MetadataManager.calculateHash(incomingContent);
            } else {
              newHashes[relativePath] = MetadataManager.calculateHash(localContent);
            }
            break;
          }
          case 'skip':
            newHashes[relativePath] = metadataManager.getOriginalHash(component, relativePath) || 
                                      MetadataManager.calculateHash(localContent);
            break;
        }
        break;
      }
    }
  }

  // Update metadata
  metadataManager.updateComponent(component, latestVersion, newHashes);
  success(`Upgraded ${component} to ${latestVersion}`);
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
