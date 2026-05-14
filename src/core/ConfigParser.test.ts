import { ConfigParser } from './ConfigParser';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('ConfigParser', () => {
  let parser: ConfigParser;

  beforeEach(() => {
    parser = new ConfigParser();
    jest.clearAllMocks();
  });

  describe('parse', () => {
    it('should parse valid .ai.toml file', () => {
      const tomlContent = `
[project]
name = "test-project"
topology = "nestjs"

[harness]
base = ["base", "typescript"]
runtime = ["node"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      const config = parser.parse('/some/path/.ai.toml');

      expect(config).toEqual({
        project: {
          name: 'test-project',
          topology: 'nestjs',
        },
        harness: {
          base: ['base', 'typescript'],
          runtime: ['node'],
        },
      });
    });

    it('should throw error when file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => parser.parse('/some/path/.ai.toml')).toThrow(
        'Configuration file not found: /some/path/.ai.toml'
      );
    });

    it('should use default topology when not specified', () => {
      const tomlContent = `
[project]
name = "test-project"

[harness]
base = ["base"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      const config = parser.parse('/some/path/.ai.toml');

      expect(config.project.topology).toBe('generic');
    });

    it('should use empty runtime array when not specified', () => {
      const tomlContent = `
[project]
name = "test-project"

[harness]
base = ["base"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      const config = parser.parse('/some/path/.ai.toml');

      expect(config.harness.runtime).toEqual([]);
    });

    it('should throw error when project section is missing', () => {
      const tomlContent = `
[harness]
base = ["base"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      expect(() => parser.parse('/some/path/.ai.toml')).toThrow(
        'Missing or invalid [project] section in configuration'
      );
    });

    it('should throw error when project.name is missing', () => {
      const tomlContent = `
[project]
topology = "nestjs"

[harness]
base = ["base"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      expect(() => parser.parse('/some/path/.ai.toml')).toThrow(
        'Missing or invalid project.name in configuration'
      );
    });

    it('should throw error when harness section is missing', () => {
      const tomlContent = `
[project]
name = "test-project"
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      expect(() => parser.parse('/some/path/.ai.toml')).toThrow(
        'Missing or invalid [harness] section in configuration'
      );
    });

    it('should throw error when harness.base is missing', () => {
      const tomlContent = `
[project]
name = "test-project"

[harness]
runtime = ["node"]
`;
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      expect(() => parser.parse('/some/path/.ai.toml')).toThrow(
        'Missing or invalid harness.base array in configuration'
      );
    });
  });

  describe('parseOrDefault', () => {
    it('should parse config when .ai.toml exists', () => {
      const tomlContent = `
[project]
name = "test-project"

[harness]
base = ["base"]
`;
      mockedFs.existsSync
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      mockedFs.readFileSync.mockReturnValue(tomlContent);

      const config = parser.parseOrDefault('/some/project');

      expect(config.project.name).toBe('test-project');
    });

    it('should return default config when .ai.toml does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const config = parser.parseOrDefault('/some/project');

      expect(config).toEqual({
        project: {
          name: 'unnamed',
          topology: 'generic',
        },
        harness: {
          base: ['base'],
          runtime: [],
        },
      });
    });

    it('should construct correct path for .ai.toml', () => {
      mockedFs.existsSync.mockReturnValue(false);

      parser.parseOrDefault('/some/project');

      expect(mockedFs.existsSync).toHaveBeenCalledWith(
        path.join('/some/project', '.ai.toml')
      );
    });
  });
});
