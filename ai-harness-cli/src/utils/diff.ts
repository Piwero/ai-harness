import { createTwoFilesPatch } from 'diff';
import chalk from 'chalk';

export interface DiffOptions {
  contextLines?: number;
  showColors?: boolean;
}

export function showDiff(
  original: string,
  modified: string,
  originalName = 'original',
  modifiedName = 'modified',
  options: DiffOptions = {}
): void {
  const { contextLines = 3, showColors = true } = options;

  const patch = createTwoFilesPatch(
    originalName,
    modifiedName,
    original,
    modified,
    undefined,
    undefined,
    { context: contextLines }
  );

  if (!showColors) {
    console.log(patch);
    return;
  }

  const lines = patch.split('\n');
  for (const line of lines) {
    if (line.startsWith('+')) {
      console.log(chalk.green(line));
    } else if (line.startsWith('-')) {
      console.log(chalk.red(line));
    } else if (line.startsWith('@@')) {
      console.log(chalk.cyan(line));
    } else {
      console.log(line);
    }
  }
}

export function hasChanges(original: string, modified: string): boolean {
  return original !== modified;
}

export function getDiffStats(original: string, modified: string): { added: number; removed: number } {
  const patch = createTwoFilesPatch('a', 'b', original, modified);
  const lines = patch.split('\n');

  let added = 0;
  let removed = 0;

  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed++;
    }
  }

  return { added, removed };
}

export function createUnifiedDiff(
  original: string,
  modified: string,
  originalName = 'original',
  modifiedName = 'modified'
): string {
  return createTwoFilesPatch(
    originalName,
    modifiedName,
    original,
    modified
  );
}
