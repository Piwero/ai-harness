import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import * as os from 'os';

describe('ah provider commands', () => {
  let tempDir: string;
  const cliPath = path.join(__dirname, '../../dist/index.js');

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-provider-test-'));
  });

  afterEach(async () => {
    fs.removeSync(tempDir);
  });

  describe('ah provider list', () => {
    it('should show available providers', () => {
      const result = execSync(`node ${cliPath} provider list`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(result).toContain('Available provider templates:');
      expect(result).toContain('opencode');
    });

    it('should show provider version and description', () => {
      const result = execSync(`node ${cliPath} provider list`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(result).toContain('opencode@1.0.0');
      expect(result).toContain('OpenCode provider template');
    });

    it('should show provider capabilities', () => {
      const result = execSync(`node ${cliPath} provider list`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(result).toContain('Capabilities:');
      expect(result).toContain('agents');
      expect(result).toContain('skills');
      expect(result).toContain('plugins');
      expect(result).toContain('mcp');
    });
  });

  describe('ah provider setup (init)', () => {
    it('should create .opencode/ directory', () => {
      execSync(`node ${cliPath} provider setup opencode -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(fs.existsSync(path.join(tempDir, '.opencode'))).toBe(true);
    });

    it('should create opencode.json configuration file', () => {
      execSync(`node ${cliPath} provider setup opencode -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const opencodeJsonPath = path.join(tempDir, '.opencode', 'opencode.json');
      expect(fs.existsSync(opencodeJsonPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(opencodeJsonPath, 'utf-8'));
      expect(config.$schema).toBe('https://opencode.ai/config.json');
      expect(config.model).toBeDefined();
    });

    it('should create agents component by default', () => {
      execSync(`node ${cliPath} provider setup opencode -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const agentsPath = path.join(tempDir, '.opencode', 'agents');
      expect(fs.existsSync(agentsPath)).toBe(true);
      expect(fs.existsSync(path.join(agentsPath, 'default.json'))).toBe(true);
    });

    it('should create skills component', () => {
      execSync(`node ${cliPath} provider setup opencode -c agents,skills -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const skillsPath = path.join(tempDir, '.opencode', 'skills');
      expect(fs.existsSync(skillsPath)).toBe(true);
    });

    it('should create all components when specified', () => {
      execSync(`node ${cliPath} provider setup opencode -c agents,skills,plugins,mcp -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      expect(fs.existsSync(path.join(tempDir, '.opencode', 'agents'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.opencode', 'skills'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.opencode', 'plugins'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.opencode', 'mcp'))).toBe(true);
    });

    it('should substitute variables in generated files', () => {
      // Create a minimal .ai.toml for substitution testing
      fs.writeFileSync(path.join(tempDir, '.ai.toml'), `
[project]
name = "test-project"
description = "Test project description"
`);

      execSync(`node ${cliPath} provider setup opencode -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const agentsPath = path.join(tempDir, '.opencode', 'agents', 'default.json');
      const agentConfig = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));
      expect(agentConfig.name).toBe('test-project-agent');
      expect(agentConfig.description).toContain('test-project');
    });
  });

  describe('ah add opencode:agents', () => {
    beforeEach(() => {
      // Initialize the project with harness first
      execSync(`node ${cliPath} init -t generic -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });
    });

    it('should add only agents component when specified', () => {
      execSync(`node ${cliPath} add opencode:agents -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const agentsPath = path.join(tempDir, '.opencode', 'agents');
      expect(fs.existsSync(agentsPath)).toBe(true);
      expect(fs.existsSync(path.join(agentsPath, 'default.json'))).toBe(true);

      // Verify skills were not added
      const skillsPath = path.join(tempDir, '.opencode', 'skills');
      expect(fs.existsSync(skillsPath)).toBe(false);
    });
  });

  describe('ah add opencode:skills', () => {
    beforeEach(() => {
      // Initialize the project with harness first
      execSync(`node ${cliPath} init -t generic -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });
    });

    it('should add only skills component when specified', () => {
      execSync(`node ${cliPath} add opencode:skills -f`, {
        cwd: tempDir,
        encoding: 'utf-8'
      });

      const skillsPath = path.join(tempDir, '.opencode', 'skills');
      expect(fs.existsSync(skillsPath)).toBe(true);

      // Verify agents were not added
      const agentsPath = path.join(tempDir, '.opencode', 'agents');
      expect(fs.existsSync(agentsPath)).toBe(false);
    });
  });
});
