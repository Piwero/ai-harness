import * as path from 'path';
import * as fs from 'fs-extra';
import { beforeEach, afterEach } from '@jest/globals';

// Augment the global type
declare global {
  var testDir: string;
}

// Create temp directory for each test
beforeEach(() => {
  const tmpDir = path.join(__dirname, '..', '.tmp-test');
  fs.ensureDirSync(tmpDir);
  global.testDir = tmpDir;
});

// Cleanup temp directory after each test
afterEach(() => {
  const tmpDir = path.join(__dirname, '..', '.tmp-test');
  if (fs.existsSync(tmpDir)) {
    try {
      fs.removeSync(tmpDir);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
});
