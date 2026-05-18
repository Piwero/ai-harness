import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs-extra';
import { beforeEach, afterEach } from '@jest/globals';

// Augment the global type
declare global {
  var testDir: string;
}

// Create unique temp directory for each test
beforeEach(() => {
  const uniqueDir = `.tmp-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tmpDir = path.join(os.tmpdir(), uniqueDir);
  fs.ensureDirSync(tmpDir);
  global.testDir = tmpDir;
});

// Cleanup temp directory after each test
afterEach(() => {
  const tmpDir = global.testDir;
  if (tmpDir && fs.existsSync(tmpDir)) {
    try {
      fs.removeSync(tmpDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});
