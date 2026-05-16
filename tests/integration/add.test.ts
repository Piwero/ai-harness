import * as path from 'path';
import * as fs from 'fs-extra';
import { ProjectScaffolder } from '../../src/scaffold';

// Mock prompts module
jest.mock('../../src/utils/prompts', () => ({
  confirm: jest.fn().mockResolvedValue(true),
  select: jest.fn().mockResolvedValue(''),
  input: jest.fn().mockResolvedValue(''),
  mergeConflict: jest.fn().mockResolvedValue('accept'),
  chooseAction: jest.fn().mockImplementation((_message: string, choices: any[]) => choices[0]?.value),
}));

describe('ah add', () => {
  let testProjectPath: string;

  beforeEach(() => {
    testProjectPath = path.join((global as any).testDir, 'test-project');
    fs.ensureDirSync(testProjectPath);
    
    // Initialize project first
    const scaffolder = new ProjectScaffolder();
    scaffolder.scaffoldProject(testProjectPath, { template: 'generic' });
  });

  it('should add base component to initialized project', async () => {
    const scaffolder = new ProjectScaffolder();
    
    // Add base component (already exists from init, but test red-add)
    await scaffolder.addComponent(testProjectPath, 'base');

    // Verify component exists
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base/harness.toml'))).toBe(true);
  });

  it('should track added component in metadata', async () => {
    const scaffolder = new ProjectScaffolder();
    await scaffolder.addComponent(testProjectPath, 'base', '1.0.0');

    // Read metadata
    const metadataPath = path.join(testProjectPath, '.ai/.scaffold-metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    expect(metadata.components.base).toBeDefined();
    expect(metadata.components.base.version).toBe('1.0.0');
    expect(metadata.components.base.files).toBeDefined();
  });

  it('should update .ai.toml when adding component', async () => {
    const scaffolder = new ProjectScaffolder();
    await scaffolder.addComponent(testProjectPath, 'base', '1.0.0');

    // Read .ai.toml
    const tomlPath = path.join(testProjectPath, '.ai.toml');
    const tomlContent = fs.readFileSync(tomlPath, 'utf-8');

    expect(tomlContent).toContain('base');
    expect(tomlContent).toContain('1.0.0');
  });

  it('should throw error for non-existent component', async () => {
    const scaffolder = new ProjectScaffolder();
    
    await expect(
      scaffolder.addComponent(testProjectPath, 'nonexistent')
    ).rejects.toThrow();
  });
});
