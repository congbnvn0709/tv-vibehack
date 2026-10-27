import { AdbService } from './adb-service';

export interface DebloatResult {
  disabled: string[];
  suspended: string[];
  failed: string[];
}

export class ProvisionService {
  private adb: AdbService;

  constructor(adb: AdbService) {
    this.adb = adb;
  }

  public async applyDebloat(
    host: string,
    port: number,
    packages: string[],
    onProgress?: (msg: string) => void
  ): Promise<DebloatResult> {
    const disabled: string[] = [];
    const suspended: string[] = [];
    const failed: string[] = [];

    for (const pkg of packages) {
      onProgress?.(`Đang xử lý gói: ${pkg}...`);
      try {
        const out = await this.adb.shell(host, port, `pm disable-user --user 0 ${pkg}`);
        if (out.includes('SecurityException') || out.includes('not allowed')) {
          onProgress?.(`Phát hiện giới hạn quyền hệ thống trên Android 14. Chuyển sang đóng băng (suspend): ${pkg}...`);
          const suspOut = await this.adb.shell(host, port, `pm suspend ${pkg}`);
          if (suspOut.toLowerCase().includes('package') || suspOut.includes('true')) {
            suspended.push(pkg);
          } else {
            failed.push(pkg);
          }
        } else {
          disabled.push(pkg);
        }
      } catch (err: any) {
        // Try suspend fallback
        try {
          await this.adb.shell(host, port, `pm suspend ${pkg}`);
          suspended.push(pkg);
        } catch {
          failed.push(pkg);
        }
      }
    }

    return { disabled, suspended, failed };
  }

  public async deployLauncher(
    host: string,
    port: number,
    apkPath: string,
    onProgress?: (msg: string) => void
  ): Promise<boolean> {
    onProgress?.('Tắt trình xác minh gói bảo mật tạm thời (cho phép sideload)...');
    try {
      await this.adb.shell(host, port, 'settings put global package_verifier_enable 0');
      await this.adb.shell(host, port, 'settings put global verifier_verify_adb_installs 0');
    } catch {
      // ignore settings failure
    }

    onProgress?.('Đang truyền và cài đặt APK Launcher tvOS lên tivi...');
    const installArgs = this.adb.buildDeviceArgs(host, port, ['install', '-r', '-t', '-d', '-g', apkPath]);
    const out = await this.adb.execAdb(installArgs);

    return out.includes('Success');
  }

  public async setupAccessibilityService(host: string, port: number): Promise<boolean> {
    const pkg = 'com.gathin.tvhome';
    const srv = 'com.gathin.tvhome/.TvAccessibilityService';

    try {
      await this.adb.shell(host, port, `pm grant ${pkg} android.permission.WRITE_SECURE_SETTINGS`);
      await this.adb.shell(host, port, `settings put secure enabled_accessibility_services ${srv}`);
      await this.adb.shell(host, port, `settings put secure accessibility_enabled 1`);
      return true;
    } catch {
      return false;
    }
  }

  public async setDefaultHome(
    host: string,
    port: number,
    launcherComponent = 'com.gathin.tvhome/.MainActivity'
  ): Promise<boolean> {
    try {
      // 1. Disable tungsten setupwraith if active (avoids Google TV RecoveryActivity trap)
      await this.adb.shell(host, port, 'pm disable-user --user 0 com.google.android.tungsten.setupwraith || true');

      // 2. Disable default launchers: Google TV (launcherx) and Android 7/8/9 (leanbacklauncher)
      await this.adb.shell(host, port, 'pm disable-user --user 0 com.google.android.apps.tv.launcherx || true');
      await this.adb.shell(host, port, 'pm disable-user --user 0 com.google.android.leanbacklauncher || true');

      // 3. Set custom home activity (Supported on Android 8+)
      try {
        await this.adb.shell(host, port, `cmd package set-home-activity --user 0 ${launcherComponent}`);
      } catch {
        // Fallback for Android 7 where cmd package set-home-activity is unavailable (resolved automatically by intent)
      }
      return true;
    } catch {
      return false;
    }
  }
}
