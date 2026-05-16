import inquirer from 'inquirer';

export async function confirm(message: string, defaultValue = false): Promise<boolean> {
  const { result } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'result',
      message,
      default: defaultValue,
    },
  ]);
  return result;
}

export async function select(message: string, choices: string[]): Promise<string> {
  const { result } = await inquirer.prompt([
    {
      type: 'list',
      name: 'result',
      message,
      choices,
    },
  ]);
  return result;
}

export async function input(message: string, defaultValue?: string): Promise<string> {
  const { result } = await inquirer.prompt([
    {
      type: 'input',
      name: 'result',
      message,
      default: defaultValue,
    },
  ]);
  return result;
}

export async function mergeConflict(
  filePath: string,
  options: { hasChanges: boolean }
): Promise<'accept' | 'keep' | 'edit' | 'skip' | 'diff'> {
  const message = options.hasChanges
    ? `File ${filePath} has local modifications. Resolve conflict:`
    : `File ${filePath} differs from template. Choose action:`;

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message,
      choices: [
        { name: '[y] Accept new version (overwrite local)', value: 'accept' },
        { name: '[n] Keep local version (skip update)', value: 'keep' },
        { name: '[d] Show diff', value: 'diff' },
        { name: '[e] Edit manually', value: 'edit' },
        { name: '[s] Skip this file', value: 'skip' },
      ],
    },
  ]);

  return action;
}

export async function chooseAction<T extends string>(
  message: string,
  choices: { name: string; value: T }[]
): Promise<T> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message,
      choices,
    },
  ]);
  return action;
}
