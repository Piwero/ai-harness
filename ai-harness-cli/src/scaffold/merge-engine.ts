import * as fs from 'fs-extra';
import { MergeContext, MergeResult } from '../types/scaffold';
import { MetadataManager } from './metadata-manager';
import { verbose } from '../utils/logger';

export class MergeEngine {
  private metadataManager: MetadataManager;

  constructor(
    projectPath: string,
    private isVerbose = false
  ) {
    this.metadataManager = new MetadataManager(projectPath, isVerbose);
  }

  /**
   * Check if a file has local modifications compared to the original scaffolded version
   */
  hasLocalChanges(component: string, filePath: string, localContent: string): boolean {
    verbose(`Checking for local changes in ${component}/${filePath}`, this.isVerbose);

    const originalHash = this.metadataManager.getOriginalHash(component, filePath);
    if (!originalHash) {
      verbose('No original hash found, assuming no local changes', this.isVerbose);
      return false;
    }

    const localHash = MetadataManager.calculateHash(localContent);
    const hasChanges = originalHash !== localHash;
    
    verbose(`Original: ${originalHash}, Local: ${localHash}, Changed: ${hasChanges}`, this.isVerbose);
    return hasChanges;
  }

  /**
   * Determine the merge strategy for a file
   */
  determineMergeAction(
    component: string,
    filePath: string,
    originalContent: string,
    localContent: string,
    incomingContent: string
  ): MergeResult {
    verbose(`Determining merge action for ${component}/${filePath}`, this.isVerbose);

    const originalHash = MetadataManager.calculateHash(originalContent);
    const localHash = MetadataManager.calculateHash(localContent);
    const incomingHash = MetadataManager.calculateHash(incomingContent);

    // If local hasn't changed from original, accept incoming
    if (originalHash === localHash) {
      verbose('No local changes, auto-accepting incoming', this.isVerbose);
      return {
        action: 'accept',
        content: incomingContent,
      };
    }

    // If incoming hasn't changed from original, keep local
    if (originalHash === incomingHash) {
      verbose('No incoming changes, keeping local', this.isVerbose);
      return {
        action: 'keep',
        content: localContent,
      };
    }

    // Both have changed - need manual resolution
    verbose('Conflict detected - both local and incoming have changes', this.isVerbose);
    return {
      action: 'conflict',
      context: {
        filePath,
        original: originalContent,
        local: localContent,
        incoming: incomingContent,
      },
    };
  }

  /**
   * Create a three-way merge result with conflict markers
   */
  createConflictedContent(context: MergeContext): string {
    const { original, local, incoming, filePath } = context;
    
    return `<<<<<<< CURRENT (${filePath})
${local}
=======
${incoming}
>>>>>>> INCOMING (${filePath})
`;
  }

  /**
   * Apply a merge result to update the file and metadata
   */
  async applyMergeResult(
    component: string,
    filePath: string,
    result: MergeResult
  ): Promise<void> {
    verbose(`Applying merge result for ${component}/${filePath}: ${result.action}`, this.isVerbose);

    switch (result.action) {
      case 'accept':
        if (result.content !== undefined) {
          await fs.writeFile(filePath, result.content, 'utf-8');
          this.metadataManager.updateFileHash(
            component,
            filePath,
            MetadataManager.calculateHash(result.content)
          );
        }
        break;

      case 'keep':
        // Update hash in case the file was previously conflicted
        if (result.content !== undefined) {
          this.metadataManager.updateFileHash(
            component,
            filePath,
            MetadataManager.calculateHash(result.content)
          );
        }
        break;

      case 'skip':
        verbose(`Skipping ${filePath}`, this.isVerbose);
        break;

      case 'conflict':
        throw new Error(`Unresolved conflict for ${filePath}`);

      default:
        throw new Error(`Unknown merge action: ${result.action}`);
    }
  }

  /**
   * Get statistics about changes in a merge
   */
  getMergeStats(
    component: string,
    filePaths: string[],
    incomingContents: Record<string, string>
  ): {
    autoAccept: number;
    autoKeep: number;
    conflicts: number;
  } {
    let autoAccept = 0;
    let autoKeep = 0;
    let conflicts = 0;

    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        autoAccept++; // New file
        continue;
      }

      const localContent = fs.readFileSync(filePath, 'utf-8');
      const incomingContent = incomingContents[filePath];
      
      const originalHash = this.metadataManager.getOriginalHash(component, filePath);
      const localHash = MetadataManager.calculateHash(localContent);
      const incomingHash = MetadataManager.calculateHash(incomingContent);

      if (!originalHash || originalHash === localHash) {
        autoAccept++;
      } else if (originalHash === incomingHash) {
        autoKeep++;
      } else {
        conflicts++;
      }
    }

    return { autoAccept, autoKeep, conflicts };
  }
}
