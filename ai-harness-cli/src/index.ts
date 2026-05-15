#!/usr/bin/env node

import { Command } from 'commander';
import { PackageInfo } from './types/cli';

// Commands
import {
  createInitCommand,
  createAddCommand,
  createUpgradeCommand,
  createValidateCommand,
  createListCommand
} from './commands';

// Utils
import { error } from './utils/logger';

// Package info (will be populated by require)
const packageInfo: PackageInfo = {
  name: 'ai-harness-cli',
  version: '0.1.0',
  description: 'CLI tool for AI Harness Framework'
};

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

  // Global error handling
  program.exitOverride();

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      // Don't show help errors as fatal
      if (err.name === 'CommanderError' && err.message.includes('outputHelp')) {
        process.exit(0);
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
