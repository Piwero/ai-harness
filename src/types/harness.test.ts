import {
  HarnessConfig,
  Sensor,
  SensorResult
} from './harness';

describe('Harness Types', () => {
  it('should create valid HarnessConfig', () => {
    const config: HarnessConfig = {
      project: { name: 'test', topology: 'typescript' },
      harness: {
        base: ['base'],
        runtime: ['typescript']
      }
    };
    expect(config.project.name).toBe('test');
    expect(config.harness.base).toContain('base');
  });

  it('should create valid Sensor', () => {
    const sensor: Sensor = {
      name: 'eslint',
      type: 'computational',
      cmd: 'npm run lint',
      autoFix: true,
      severity: 'error'
    };
    expect(sensor.type).toBe('computational');
    expect(sensor.severity).toBe('error');
  });

  it('should create valid SensorResult', () => {
    const result: SensorResult = {
      sensor: 'eslint',
      passed: false,
      issues: [{ message: 'Missing semicolon', file: 'test.ts', line: 10 }],
      timestamp: new Date().toISOString()
    };
    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
  });
});
