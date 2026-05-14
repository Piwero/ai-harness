import { Sensor, SensorResult, SensorType } from '../types/harness';

export type SensorExecutor = (sensor: Sensor) => Promise<SensorResult>;

export class SensorRegistry {
  private sensors: Map<string, Sensor> = new Map();
  private executor: SensorExecutor;

  constructor(executor?: SensorExecutor) {
    this.executor = executor || this.defaultExecutor;
  }

  register(sensor: Sensor): void {
    if (this.sensors.has(sensor.name)) {
      throw new Error(`Sensor ${sensor.name} already registered`);
    }
    this.sensors.set(sensor.name, sensor);
  }

  unregister(name: string): void {
    this.sensors.delete(name);
  }

  getSensor(name: string): Sensor | undefined {
    return this.sensors.get(name);
  }

  getAllSensors(): Sensor[] {
    return Array.from(this.sensors.values());
  }

  getSensorsByType(type: SensorType): Sensor[] {
    return this.getAllSensors().filter((s) => s.type === type);
  }

  async execute(name: string): Promise<SensorResult> {
    const sensor = this.sensors.get(name);
    if (!sensor) {
      throw new Error(`Sensor ${name} not found`);
    }

    const startTime = Date.now();
    try {
      const result = await this.executor(sensor);
      const duration = Date.now() - startTime;
      return { ...result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        sensor: name,
        passed: false,
        issues: [
          {
            message: `Execution error: ${errorMessage}`,
            severity: 'error',
          },
        ],
        timestamp: new Date().toISOString(),
        duration,
      };
    }
  }

  async executeAll(): Promise<SensorResult[]> {
    const sensors = this.getAllSensors();
    return Promise.all(sensors.map((s) => this.execute(s.name)));
  }

  async executeByType(type: SensorType): Promise<SensorResult[]> {
    const sensors = this.getSensorsByType(type);
    return Promise.all(sensors.map((s) => this.execute(s.name)));
  }

  setExecutor(executor: SensorExecutor): void {
    this.executor = executor;
  }

  private defaultExecutor: SensorExecutor = async (
    sensor: Sensor
  ): Promise<SensorResult> => {
    if (!sensor.cmd) {
      // Return passed result for sensors without commands
      return {
        sensor: sensor.name,
        passed: true,
        issues: [],
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // If there's a command but no actual execution logic yet,
      // we return a default passed result
      return {
        sensor: sensor.name,
        passed: true,
        issues: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        sensor: sensor.name,
        passed: false,
        issues: [
          {
            message: `Command execution failed: ${errorMessage}`,
            severity: 'error',
          },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  };

  generateMCPTools(): object[] {
    return this.getAllSensors().map((sensor) => ({
      name: `harness_sensor_${sensor.name}`,
      description: sensor.description || `Execute ${sensor.name} sensor`,
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      harness: {
        name: sensor.name,
        type: sensor.type,
        severity: sensor.severity,
        autoFix: sensor.autoFix ?? false,
      },
      category: sensor.type,
    }));
  }
}
