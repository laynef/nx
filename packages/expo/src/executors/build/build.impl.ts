import { ExecutorContext, names } from '@nx/devkit';
import { resolve as pathResolve } from 'path';
import { ChildProcess, fork } from 'child_process';

import { resolveEas } from '../../utils/resolve-eas';

import { ExpoEasBuildOptions } from './schema';

export interface ReactNativeBuildOutput {
  success: boolean;
}

let childProcess: ChildProcess;

export default async function* buildExecutor(
  options: ExpoEasBuildOptions,
  context: ExecutorContext,
): AsyncGenerator<ReactNativeBuildOutput> {
  const projectRoot =
    context.projectsConfigurations.projects[context.projectName].root;

  try {
    await runCliBuild(context.root, projectRoot, options);
    yield { success: true };
  } finally {
    if (childProcess) {
      childProcess.kill();
    }
  }
}

function runCliBuild(
  workspaceRoot: string,
  projectRoot: string,
  options: ExpoEasBuildOptions,
) {
  return new Promise((resolve, reject) => {
    childProcess = fork(
      resolveEas(workspaceRoot),
      ['build', ...createBuildOptions(options)],
      {
        cwd: pathResolve(workspaceRoot, projectRoot),
        env: process.env,
      },
    );

    // Ensure the child process is killed when the parent exits
    process.on('exit', () => childProcess.kill());
    process.on('SIGTERM', () => childProcess.kill());

    childProcess.on('error', (err) => {
      reject(err);
    });
    childProcess.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

function createBuildOptions(options: ExpoEasBuildOptions) {
  return Object.keys(options).reduce((acc, k) => {
    const v = options[k];
    if (typeof v === 'boolean') {
      if (k === 'interactive') {
        if (v === false) {
          acc.push('--non-interactive'); // when is false, the flag is --non-interactive
        }
      } else if (k === 'wait') {
        if (v === false) {
          acc.push('--no-wait'); // when is false, the flag is --no-wait
        } else {
          acc.push('--wait');
        }
      } else if (v === true) {
        // when true, does not need to pass the value true, just need to pass the flag in kebob case
        acc.push(`--${names(k).fileName}`);
      }
    } else {
      acc.push(`--${names(k).fileName}`, v);
    }
    return acc;
  }, []);
}
