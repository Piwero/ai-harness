import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { ScaffoldMetadata, ComponentMetadata } from '../types/scaffold';
import { verbose } from '../utils/logger';

const METADATA_FILE = '.scaffold-metadata.json';
const METADATA_VERSION = '1.0.0';

export class MetadataManager {
  private metadataPath: string;

  constructor(projectPath: string, private isVerbose = false) {
    this.metadataPath = path.join(projectPath, '.ai', METADATA_FILE);
  }

  /**
   * Load scaffold metadata for the project
   */
  loadMetadata(): ScaffoldMetadata | undefined {
    verbose(`Loading metadata from ${this.metadataPath}`, this.isVerbose);

    if (!fs.existsSync(this.metadataPath)) {
      verbose('No metadata file found', this.isVerbose);
      return undefined;
    }

    try {
      const content = fs.readFileSync(this.metadataPath, 'utf-8');
      const metadata: ScaffoldMetadata = JSON.parse(content);
      verbose(`Loaded metadata for ${Object.keys(metadata.components).length} components`, this.isVerbose);
      return metadata;
    } catch (error) {
      verbose(`Error loading metadata: ${error}`, this.isVerbose);
      return undefined;
    }
  }

  /**
   * Save scaffold metadata for the project
   */
  saveMetadata(metadata: ScaffoldMetadata): void {
    verbose(`Saving metadata to ${this.metadataPath}`, this.isVerbose);

    // Ensure .ai directory exists
    const aiDir = path.dirname(this.metadataPath);
    fs.ensureDirSync(aiDir);

    fs.writeFileSync(this.metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Initialize new metadata for a project
   */
  initMetadata(): ScaffoldMetadata {
    const metadata: ScaffoldMetadata = {
      version: METADATA_VERSION,
      scaffoldedAt: new Date().toISOString(),
      components: {},
    };

    this.saveMetadata(metadata);
    return metadata;
  }

  /**
   * Check if metadata exists
   */
  hasMetadata(): boolean {
    return fs.existsSync(this.metadataPath);
  }

  /**
   * Get component metadata
   */
  getComponentMetadata(component: string): ComponentMetadata | undefined {
    const metadata = this.loadMetadata();
    return metadata?.components[component];
  }

  /**
   * Get the version of a component that was originally scaffolded
   */
  getScaffoldedVersion(component: string): string | undefined {
    const metadata = this.loadMetadata();
    return metadata?.components[component]?.version;
  }

  /**
   * Get the hash of a file at the time it was scaffolded
   */
  getOriginalHash(component: string, filePath: string): string | undefined {
    const metadata = this.loadMetadata();
    return metadata?.components[component]?.files[filePath];
  }

  /**
   * Update component metadata after scaffolding or upgrade
   */
  updateComponent(component: string, version: string, files: Record<string, string>): void {
    verbose(`Updating metadata for ${component}@${version}`, this.isVerbose);

    const metadata = this.loadMetadata() || this.initMetadata();

    metadata.components[component] = {
      version,
      files,
    };

    this.saveMetadata(metadata);
  }

  /**
   * Update a single file hash for a component
   */
  updateFileHash(component: string, filePath: string, hash: string): void {
    verbose(`Updating hash for ${component}/${filePath}`, this.isVerbose);

    const metadata = this.loadMetadata();
    if (!metadata) {
      throw new Error('No metadata found. Run init first.');
    }

    if (!metadata.components[component]) {
      throw new Error(`Component ${component} not found in metadata`);
    }

    metadata.components[component].files[filePath] = hash;
    this.saveMetadata(metadata);
  }

  /**
   * Remove a component from metadata
   */
  removeComponent(component: string): void {
    verbose(`Removing ${component} from metadata`, this.isVerbose);

    const metadata = this.loadMetadata();
    if (!metadata) return;

    delete metadata.components[component];
    this.saveMetadata(metadata);
  }

  /**
   * Get all tracked components
   */
  getTrackedComponents(): string[] {
    const metadata = this.loadMetadata();
    return metadata ? Object.keys(metadata.components) : [];
  }

  /**
   * Calculate MD5 hash of file content
   */
  static calculateHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Calculate hash of a file on disk
   */
  static calculateFileHash(filePath: string): string | undefined {
    if (!fs.existsSync(filePath)) return undefined;
    const content = fs.readFileSync(filePath, 'utf-8');
    return MetadataManager.calculateHash(content);
  }
}
