#!/usr/bin/env node

import { Command } from 'commander';
import { PackageInfo } from './types/cli';

// Commands
import {
  createInitCommand,
  createAddCommand,
  createUpgradeCommand,
  createValidateCommand,
  createListCommand,
  createProviderCommand
} from './commands';

// Utils
import { error } from './utils/logger';

// Package info - read from package.json dynamically
import * as path from 'path';
import * as fs from 'fs';

function getPackageInfo(): PackageInfo {
  try {
    // Try to read from package.json relative to the built file
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return {
      name: packageJson.name || '@piwero/ai-harness-cli',
      version: packageJson.version || '0.2.0',
      description: packageJson.description || 'CLI tool for AI Harness Framework'
    };
  } catch {
    // Fallback if package.json can't be read
    return {
      name: '@piwero/ai-harness-cli',
      version: '0.2.0',
      description: 'CLI tool for AI Harness Framework'
    };
  }
}

const packageInfo: PackageInfo = getPackageInfo();

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('ah')
    .description(packageInfo.description)
    .version(packageInfo.version, '-V, --version', 'Display version number')
    .helpOption('-h, --help', 'Display help for command')
    .configureOutput({
      outputError: (str, write) => write(`Error: ${str}`)
    });

  // Add commands
  program.addCommand(createInitCommand());
  program.addCommand(createAddCommand());
  program.addCommand(createUpgradeCommand());
  program.addCommand(createValidateCommand());
  program.addCommand(createListCommand());
  program.addCommand(createProviderCommand());

  // Global error handling
  program.exitOverride();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      // Don't show help or version display as fatal errors
      if (err.name === 'CommanderError') {
        const errCode = (err as any).code;
        const exitCode = (err as any).exitCode;
        // exitOverride makes Commander throw with exit code in error.exitCode
        // code will be 'commander.version' or 'commander.help' for display operations
        if (exitCode === 0 || errCode === 'commander.version' || errCode === 'commander.help') {
          process.exit(0);
        }
      }
      error(`Fatal error: ${err.message}`);
    }
    process.exit(1);
  }
}

// Run the CLI
main().catch((err) => {
  error(`Unexpected error: ${err}`);
  process.exit(1);
});
