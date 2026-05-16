import chalk from 'chalk';

export interface LoggerOptions {
  verbose?: boolean;
}

export class Logger {
  constructor(private options: LoggerOptions = {}) {}

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  warning(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  verbose(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.gray('[verbose]'), message);
    }
  }

  debug(message: string): void {
    if (this.options.verbose) {
      console.log(chalk.gray('[debug]'), message);
    }
  }
}

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function verbose(message: string, isVerbose: boolean): void {
  if (isVerbose) {
    console.log(chalk.gray('[verbose]'), message);
  }
}

export function debug(message: string, isVerbose: boolean): void {
  if (isVerbose) {
    console.log(chalk.gray('[debug]'), message);
  }
}
