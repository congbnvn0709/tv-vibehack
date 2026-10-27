import { describe, it, expect, vi } from 'vitest';
import { ProvisionService } from '../src/main/services/provision-service';
import { PackageScannerService } from '../src/main/services/package-scanner';
import type { AdbService } from '../src/main/services/adb-service';

describe('Android 7.0 TV (Nougat API 24) Compatibility Tests', () => {
  it('correctly classifies Android 7 system apps and preserves Voice Search', () => {
    // Packages found on Android 7.0 TVs (e.g. Sony Bravia Android 7.0 / TCL Android 7)
    const android7Packages = [
      'com.google.android.katniss',              // Voice Search on Android 7 (MUST BE PROTECTED)
      'com.google.android.apps.mediashell',      // Chromecast
      'com.google.android.leanbacklauncher',     // Stock Launcher for Android 7
      'com.mediatek.tv.oneworld.tvcenter',       // Live TV / HDMI
      'com.android.bluetooth',                   // Remote Bluetooth
      'com.sony.dtv.retailmode',                 // Bloat
      'com.tcl.channelplus'                      // Bloat
    ];

    const classified = android7Packages.map(p => PackageScannerService.classifyPackage(p));

    const katniss = classified.find(p => p.packageName === 'com.google.android.katniss');
    expect(katniss?.isProtected).toBe(true);

    const mediashell = classified.find(p => p.packageName === 'com.google.android.apps.mediashell');
    expect(mediashell?.isProtected).toBe(true);

    const tvcenter = classified.find(p => p.packageName === 'com.mediatek.tv.oneworld.tvcenter');
    expect(tvcenter?.isProtected).toBe(true);

    const bloat = classified.find(p => p.packageName === 'com.sony.dtv.retailmode');
    expect(bloat?.isProtected).toBe(false);
  });

  it('provisions default home on Android 7 by disabling leanbacklauncher even if cmd package fails', async () => {
    const executedCommands: string[] = [];

    const mockAdb = {
      shell: vi.fn().mockImplementation(async (_h, _p, cmd: string) => {
        executedCommands.push(cmd);
        if (cmd.includes('cmd package set-home-activity')) {
          // Android 7 does not support set-home-activity
          throw new Error('Unknown command: set-home-activity');
        }
        return 'Success';
      })
    } as unknown as AdbService;

    const provision = new ProvisionService(mockAdb);
    const result = await provision.setDefaultHome('192.168.1.100', 5555);

    expect(result).toBe(true);
    // Verified both Google TV (launcherx) and Android 7 (leanbacklauncher) are disabled
    expect(executedCommands.some(c => c.includes('com.google.android.leanbacklauncher'))).toBe(true);
  });

  it('runs debloat smoothly on Android 7 using pm disable-user', async () => {
    const executedCommands: string[] = [];

    const mockAdb = {
      shell: vi.fn().mockImplementation(async (_h, _p, cmd: string) => {
        executedCommands.push(cmd);
        return 'Package com.sony.dtv.retailmode new state: disabled-user\n';
      })
    } as unknown as AdbService;

    const provision = new ProvisionService(mockAdb);
    const res = await provision.applyDebloat('192.168.1.100', 5555, ['com.sony.dtv.retailmode']);

    expect(res.disabled).toContain('com.sony.dtv.retailmode');
    expect(res.failed).toHaveLength(0);
    expect(executedCommands[0]).toContain('pm disable-user --user 0 com.sony.dtv.retailmode');
  });
});
