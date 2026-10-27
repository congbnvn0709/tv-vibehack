import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { getResourcePaths } from '../src/main/resource-helper';
import { BackupService, TvBackupData } from '../src/main/services/backup-service';
import { AdbService } from '../src/main/services/adb-service';

describe('Fix Pass: Critical & Important Review Findings', () => {
  it('Critical #1: getResourcePaths should correctly locate examples and apk in repo root', () => {
    const desktopAppPath = path.resolve(__dirname, '..');
    const { examplesDir, apkPath } = getResourcePaths(desktopAppPath, false);

    expect(fs.existsSync(examplesDir)).toBe(true);
    expect(fs.readdirSync(examplesDir)).toContain('coocaa-swtv-24ae-4k');
    expect(apkPath.endsWith('app-debug.apk')).toBe(true);
  });

  it('Critical #2: restoreBackup should execute pm enable and unsuspend for backed up packages', async () => {
    const executedCommands: string[] = [];
    const adbMock = {
      shell: vi.fn().mockImplementation(async (_h, _p, cmd: string) => {
        executedCommands.push(cmd);
        return 'Success';
      })
    } as unknown as AdbService;

    const backupService = new BackupService(adbMock);
    const mockBackup: TvBackupData = {
      timestamp: new Date().toISOString(),
      deviceModel: 'Test TV',
      currentHomeActivity: 'com.test.launcher/.MainActivity',
      disabledPackages: ['com.bad.bloat1', 'com.bad.bloat2'],
      installedPackages: ['com.bad.bloat1', 'com.bad.bloat2', 'com.good.app']
    };

    const res = await backupService.restoreBackup('192.168.1.50', 5555, mockBackup);
    expect(res.success).toBe(true);
    expect(executedCommands.some(c => c.includes('pm enable com.bad.bloat1'))).toBe(true);
    expect(executedCommands.some(c => c.includes('pm enable com.bad.bloat2'))).toBe(true);
    expect(executedCommands.some(c => c.includes('set-home-activity --user 0 com.test.launcher/.MainActivity'))).toBe(true);
  });
});
