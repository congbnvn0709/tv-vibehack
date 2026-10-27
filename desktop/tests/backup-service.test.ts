import { describe, it, expect } from 'vitest';
import { BackupService } from '../src/main/services/backup-service';
import { AdbService } from '../src/main/services/adb-service';

describe('BackupService', () => {
  it('should parse package lists accurately from adb output', () => {
    const adbMock = {} as AdbService;
    const backup = new BackupService(adbMock);
    const raw = 'package:com.google.android.apps.tv.launcherx\r\npackage:com.smartdevice.myapp\n';
    const pkgs = backup.parsePackageList(raw);
    expect(pkgs).toEqual(['com.google.android.apps.tv.launcherx', 'com.smartdevice.myapp']);
  });

  it('should parse resolved home activity correctly', () => {
    const adbMock = {} as AdbService;
    const backup = new BackupService(adbMock);
    const raw = 'priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=true\ncom.google.android.apps.tv.launcherx/.home.HomeActivity';
    const home = backup.parseResolvedHome(raw);
    expect(home).toBe('com.google.android.apps.tv.launcherx/.home.HomeActivity');
  });

  it('should handle empty or fallback home activity', () => {
    const adbMock = {} as AdbService;
    const backup = new BackupService(adbMock);
    const raw = '';
    const home = backup.parseResolvedHome(raw);
    expect(home).toBe('com.google.android.apps.tv.launcherx');
  });
});
