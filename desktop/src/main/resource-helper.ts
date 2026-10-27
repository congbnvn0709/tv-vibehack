import path from 'path';
import fs from 'fs';

export interface ResourcePaths {
  examplesDir: string;
  apkPath: string;
}

export function getResourcePaths(appPath: string, isPackaged: boolean): ResourcePaths {
  // Check candidate locations for examples
  const candidateExamples = [
    path.join((process as any).resourcesPath || '', 'examples'),
    path.join(appPath, 'examples'),
    path.join(appPath, '..', 'examples'),
    path.join(appPath, '..', '..', 'examples'),
    path.join(process.cwd(), 'examples'),
    path.join(process.cwd(), '..', 'examples')
  ];

  let examplesDir = '';
  for (const cand of candidateExamples) {
    try {
      if (cand && fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        examplesDir = cand;
        break;
      }
    } catch {
      // ignore
    }
  }

  // Check candidate locations for APK
  const candidateApks = [
    path.join((process as any).resourcesPath || '', 'app-debug.apk'),
    path.join(appPath, 'app-debug.apk'),
    path.join(appPath, '..', 'launcher/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(appPath, '..', '..', 'launcher/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(process.cwd(), 'launcher/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(process.cwd(), '..', 'launcher/app/build/outputs/apk/debug/app-debug.apk')
  ];

  let apkPath = '';
  for (const cand of candidateApks) {
    try {
      if (cand && fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        apkPath = cand;
        break;
      }
    } catch {
      // ignore
    }
  }

  return { examplesDir, apkPath };
}
