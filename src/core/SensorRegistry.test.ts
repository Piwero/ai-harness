import { SensorRegistry, SensorExecutor } from './SensorRegistry';
import { Sensor } from '../types/harness';

describe('SensorRegistry', () => {
  let registry: SensorRegistry;

  beforeEach(() => {
    registry = new SensorRegistry();
  });

  describe('register and getSensor', () => {
    it('should register and get a sensor', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        cmd: 'npm run lint',
        severity: 'error',
      };

      registry.register(sensor);

      expect(registry.getSensor('eslint')).toEqual(sensor);
    });

    it('should throw error when registering duplicate sensor name', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor);

      expect(() => registry.register(sensor)).toThrow(
        'Sensor eslint already registered'
      );
    });

    it('should return undefined for non-existent sensor', () => {
      expect(registry.getSensor('nonexistent')).toBeUndefined();
    });
  });

  describe('unregister', () => {
    it('should unregister a sensor', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor);
      registry.unregister('eslint');

      expect(registry.getSensor('eslint')).toBeUndefined();
    });

    it('should not throw when unregistering non-existent sensor', () => {
      expect(() => registry.unregister('nonexistent')).not.toThrow();
    });
  });

  describe('getAllSensors', () => {
    it('should get all registered sensors', () => {
      const sensor1: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };
      const sensor2: Sensor = {
        name: 'typecheck',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor1);
      registry.register(sensor2);

      const sensors = registry.getAllSensors();

      expect(sensors).toHaveLength(2);
      expect(sensors).toContainEqual(sensor1);
      expect(sensors).toContainEqual(sensor2);
    });

    it('should return empty array when no sensors registered', () => {
      expect(registry.getAllSensors()).toEqual([]);
    });
  });

  describe('getSensorsByType', () => {
    it('should get sensors by type', () => {
      const computational: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };
      const inferential: Sensor = {
        name: 'code-review',
        type: 'inferential',
        severity: 'warning',
      };

      registry.register(computational);
      registry.register(inferential);

      const computationalSensors = registry.getSensorsByType('computational');
      const inferentialSensors = registry.getSensorsByType('inferential');

      expect(computationalSensors).toHaveLength(1);
      expect(computationalSensors[0].name).toBe('eslint');
      expect(inferentialSensors).toHaveLength(1);
      expect(inferentialSensors[0].name).toBe('code-review');
    });

    it('should return empty array for type with no sensors', () => {
      expect(registry.getSensorsByType('computational')).toEqual([]);
    });
  });

  describe('execute', () => {
    it('should execute a sensor using default executor', async () => {
      const sensor: Sensor = {
        name: 'no-cmd-sensor',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor);
      const result = await registry.execute('no-cmd-sensor');

      expect(result.sensor).toBe('no-cmd-sensor');
      expect(result.passed).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should execute a sensor with custom executor', async () => {
      const mockExecutor: SensorExecutor = jest.fn().mockResolvedValue({
        sensor: 'eslint',
        passed: false,
        issues: [{ message: 'Error found', severity: 'error' }],
        timestamp: new Date().toISOString(),
      });

      const registryWithMock = new SensorRegistry(mockExecutor);
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        cmd: 'npm run lint',
        severity: 'error',
      };

      registryWithMock.register(sensor);
      const result = await registryWithMock.execute('eslint');

      expect(mockExecutor).toHaveBeenCalledWith(sensor);
      expect(result.sensor).toBe('eslint');
      expect(result.passed).toBe(false);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error when executing non-existent sensor', async () => {
      await expect(registry.execute('nonexistent')).rejects.toThrow(
        'Sensor nonexistent not found'
      );
    });

    it('should handle executor errors gracefully', async () => {
      const errorExecutor: SensorExecutor = jest.fn().mockRejectedValue(
        new Error('Command failed')
      );

      const registryWithError = new SensorRegistry(errorExecutor);
      const sensor: Sensor = {
        name: 'failing-sensor',
        type: 'computational',
        severity: 'error',
      };

      registryWithError.register(sensor);
      const result = await registryWithError.execute('failing-sensor');

      expect(result.passed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].message).toContain('Execution error');
      expect(result.issues[0].message).toContain('Command failed');
      expect(result.issues[0].severity).toBe('error');
    });

    it('should handle non-Error executor rejections gracefully', async () => {
      const errorExecutor: SensorExecutor = jest.fn().mockRejectedValue(
        'String error'
      );

      const registryWithError = new SensorRegistry(errorExecutor);
      const sensor: Sensor = {
        name: 'failing-sensor',
        type: 'computational',
        severity: 'error',
      };

      registryWithError.register(sensor);
      const result = await registryWithError.execute('failing-sensor');

      expect(result.passed).toBe(false);
      expect(result.issues[0].message).toContain('String error');
    });
  });

  describe('executeAll', () => {
    it('should execute all sensors', async () => {
      const sensor1: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };
      const sensor2: Sensor = {
        name: 'typecheck',
        type: 'computational',
        severity: 'warning',
      };

      registry.register(sensor1);
      registry.register(sensor2);

      const results = await registry.executeAll();

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.sensor)).toContain('eslint');
      expect(results.map((r) => r.sensor)).toContain('typecheck');
    });

    it('should return empty array when no sensors registered', async () => {
      const results = await registry.executeAll();
      expect(results).toEqual([]);
    });
  });

  describe('executeByType', () => {
    it('should execute sensors by type', async () => {
      const computational1: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };
      const computational2: Sensor = {
        name: 'typecheck',
        type: 'computational',
        severity: 'warning',
      };
      const inferential: Sensor = {
        name: 'review',
        type: 'inferential',
        severity: 'info',
      };

      registry.register(computational1);
      registry.register(computational2);
      registry.register(inferential);

      const results = await registry.executeByType('computational');

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.sensor)).toContain('eslint');
      expect(results.map((r) => r.sensor)).toContain('typecheck');
    });

    it('should return empty array when no sensors of type exist', async () => {
      const results = await registry.executeByType('computational');
      expect(results).toEqual([]);
    });
  });

  describe('generateMCPTools', () => {
    it('should generate MCP tool definitions', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        description: 'Lint TypeScript code',
        severity: 'error',
        autoFix: true,
      };

      registry.register(sensor);
      const tools = registry.generateMCPTools();

      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({
        name: 'harness_sensor_eslint',
        description: 'Lint TypeScript code',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        harness: {
          name: 'eslint',
          type: 'computational',
          severity: 'error',
          autoFix: true,
        },
        category: 'computational',
      });
    });

    it('should use default description when not provided', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor);
      const tools = registry.generateMCPTools();

      expect((tools[0] as { description: string }).description).toBe(
        'Execute eslint sensor'
      );
    });

    it('should default autoFix to false when not provided', () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };

      registry.register(sensor);
      const tools = registry.generateMCPTools();

      expect((tools[0] as { harness: { autoFix: boolean } }).harness.autoFix).toBe(
        false
      );
    });

    it('should return empty array when no sensors registered', () => {
      expect(registry.generateMCPTools()).toEqual([]);
    });
  });

  describe('setExecutor', () => {
    it('should allow setting a new executor', async () => {
      const sensor: Sensor = {
        name: 'eslint',
        type: 'computational',
        severity: 'error',
      };

      const originalExecutor = jest.fn().mockResolvedValue({
        sensor: 'eslint',
        passed: true,
        issues: [],
        timestamp: new Date().toISOString(),
      });

      const registryWithMock = new SensorRegistry(originalExecutor);
      registryWithMock.register(sensor);

      await registryWithMock.execute('eslint');
      expect(originalExecutor).toHaveBeenCalled();

      const newExecutor = jest.fn().mockResolvedValue({
        sensor: 'eslint',
        passed: false,
        issues: [{ message: 'New executor result', severity: 'warning' }],
        timestamp: new Date().toISOString(),
      });

      registryWithMock.setExecutor(newExecutor);
      const result = await registryWithMock.execute('eslint');

      expect(newExecutor).toHaveBeenCalled();
      expect(result.passed).toBe(false);
    });
  });
});
