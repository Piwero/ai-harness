import * as path from 'path';
import * as fs from 'fs-extra';
import { ProjectScaffolder } from '../../src/scaffold';

describe('ah init', () => {
  let testProjectPath: string;

  beforeEach(() => {
    testProjectPath = path.join((global as any).testDir, 'test-project');
    fs.ensureDirSync(testProjectPath);
  });

  it('should initialize harness in a new project', async () => {
    const scaffolder = new ProjectScaffolder();
    
    await scaffolder.scaffoldProject(testProjectPath, { 
      template: 'generic', 
      force: true 
    });

    // Check .ai directory was created
    expect(fs.existsSync(path.join(testProjectPath, '.ai'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base'))).toBe(true);

    // Check metadata file exists
    expect(fs.existsSync(path.join(testProjectPath, '.ai/.scaffold-metadata.json'))).toBe(true);

    // Check .ai.toml was created
    expect(fs.existsSync(path.join(testProjectPath, '.ai.toml'))).toBe(true);

    // Check base component files were copied
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base/README.md'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base/harness.toml'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, '.ai/harness/base/guides/logging.md'))).toBe(true);
  });
});
