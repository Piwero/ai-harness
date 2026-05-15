import { Orchestrator } from './Orchestrator';
import * as path from 'path';

describe('Orchestrator', () => {
  const testProjectPath = path.join(__dirname, '../../');

  // Suppress expected console warnings about missing components
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should initialize with project path', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(orchestrator).toBeDefined();
      expect(orchestrator).toBeInstanceOf(Orchestrator);
    });

    it('should store the project path', async () => {
      const orchestrator = new Orchestrator(testProjectPath);
      await orchestrator.init();
      const config = orchestrator.getConfig();
      expect(config).toBeDefined();
      expect(config.project.name).toBe('ai-harness-framework');
    });
  });

  describe('configuration loading', () => {
    it('should load configuration on init', async () => {
      const orchestrator = new Orchestrator(testProjectPath);
      await orchestrator.init();

      const config = orchestrator.getConfig();
      expect(config).toBeDefined();
      expect(config.project.name).toBe('ai-harness-framework');
      expect(config.project.topology).toBe('typescript-lib');
      expect(config.harness.base).toEqual(['base']);
      expect(config.harness.runtime).toEqual(['typescript']);
    });

    it('should throw error when trying to get config before init', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(() => orchestrator.getConfig()).toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });

    it('should throw error when trying to get components before init', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(() => orchestrator.getComponents()).toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });

    it('should throw error when trying to access sensor registry before init', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(() => orchestrator.getSensorRegistry()).toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });
  });

  describe('uninitialized state handling', () => {
    it('should require init before executeWorkflow', async () => {
      const orchestrator = new Orchestrator(testProjectPath);
      await expect(
        orchestrator.executeWorkflow({
          projectPath: testProjectPath,
          userRequest: 'test',
        })
      ).rejects.toThrow('Orchestrator not initialized. Call init() first.');
    });

    it('should require init before runSensors', async () => {
      const orchestrator = new Orchestrator(testProjectPath);
      await expect(orchestrator.runSensors()).rejects.toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });

    it('should require init before getGuides', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(() => orchestrator.getGuides()).toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });

    it('should require init before generateMCPTools', () => {
      const orchestrator = new Orchestrator(testProjectPath);
      expect(() => orchestrator.generateMCPTools()).toThrow(
        'Orchestrator not initialized. Call init() first.'
      );
    });
  });
});
