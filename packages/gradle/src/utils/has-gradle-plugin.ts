import { readNxJson, Tree } from '@nx/devkit';

export function hasGradlePlugin(tree: Tree): boolean {
  const nxJson = readNxJson(tree);
  return !!nxJson.plugins?.some((p) =>
    typeof p === 'string'
      ? p === '@nx/gradle/plugin'
      : p.plugin === '@nx/gradle/plugin'
  );
}
