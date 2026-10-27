import path from 'path';
import fs from 'fs';

export interface ResourcePaths {
  examplesDir: string;
  apkPath: string;
}

export function getResourcePaths(appPath: string, isPackaged: boolean): ResourcePaths {
  if (isPackaged) {
    const resourcesPath = (process as any).resourcesPath || appPath;
    const packagedExamples = path.join(resourcesPath, 'examples');
    const packagedApk = path.join(resourcesPath, 'app-debug.apk');
    return {
      examplesDir: packagedExamples,
      apkPath: packagedApk
    };
  }

  // In development: desktop is at <repo-root>/desktop
  // Going up 1 directory reaches <repo-root>
  const repoRoot = path.resolve(appPath, '..');
  const repoExamples = path.join(repoRoot, 'examples');
  const repoApk = path.join(repoRoot, 'launcher/app/build/outputs/apk/debug/app-debug.apk');

  return {
    examplesDir: repoExamples,
    apkPath: repoApk
  };
}
