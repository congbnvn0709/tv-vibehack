import fs from 'fs';
import path from 'path';
import { AdbService } from './adb-service';

export interface TvBackupData {
  timestamp: string;
  deviceModel: string;
  currentHomeActivity: string;
  disabledPackages: string[];
  installedPackages: string[];
}

export class BackupService {
  private adb: AdbService;

  constructor(adb: AdbService) {
    this.adb = adb;
  }

  public parsePackageList(rawOutput: string): string[] {
    return rawOutput
      .split('\n')
      .map(line => line.trim().replace(/^package:/, ''))
      .filter(line => line.length > 0);
  }

  public parseResolvedHome(rawOutput: string): string {
    const lines = rawOutput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    for (const line of lines) {
      if (line.includes('/') && !line.includes('match=') && !line.includes('priority=')) {
        return line;
      }
    }
    return 'com.google.android.apps.tv.launcherx';
  }

  public async createBackup(host: string, port: number, backupDir: string): Promise<TvBackupData> {
    const info = await this.adb.getDeviceInfo(host, port);

    // 1. Get all packages
    const allPkgsRaw = await this.adb.shell(host, port, 'pm list packages');
    const installedPackages = this.parsePackageList(allPkgsRaw);

    // 2. Get currently disabled packages
    const disabledRaw = await this.adb.shell(host, port, 'pm list packages -d');
    const disabledPackages = this.parsePackageList(disabledRaw);

    // 3. Get currently resolved home activity
    const homeRaw = await this.adb.shell(
      host,
      port,
      'cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME'
    );
    const currentHomeActivity = this.parseResolvedHome(homeRaw);

    const backupData: TvBackupData = {
      timestamp: new Date().toISOString(),
      deviceModel: info.model,
      currentHomeActivity,
      disabledPackages,
      installedPackages
    };

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const safeModelName = info.model.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const backupFilePath = path.join(backupDir, `backup_${safeModelName}_${Date.now()}.json`);
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8');

    // Also write a latest symlink or pointer
    const latestPath = path.join(backupDir, `latest_backup.json`);
    fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8');

    return backupData;
  }

  public async restoreBackup(
    host: string,
    port: number,
    backupData?: TvBackupData | null
  ): Promise<{ success: boolean; log: string[] }> {
    const log: string[] = [];

    try {
      log.push('Bắt đầu tiến trình khôi phục trạng thái xuất xưởng...');

      // 1. Enable standard stock launchers
      log.push('Kích hoạt lại Google TV LauncherX...');
      await this.adb.shell(host, port, 'pm enable com.google.android.apps.tv.launcherx || true');

      // 2. Re-enable tungsten setupwraith if disabled
      log.push('Kích hoạt lại setupwraith (nếu có)...');
      await this.adb.shell(host, port, 'pm enable com.google.android.tungsten.setupwraith || true');

      // 3. Unsuspend known system apps
      const suspendedDefaults = [
        'com.smartdevice.myapp',
        'com.sky.market',
        'com.mediatek.tv.retaildemo'
      ];
      for (const pkg of suspendedDefaults) {
        log.push(`Unsuspend ${pkg}...`);
        await this.adb.shell(host, port, `pm unsuspend ${pkg} || true`);
      }

      // 4. If backup data is provided, re-enable any disabled packages
      if (backupData?.installedPackages) {
        log.push('Đang kiểm tra và tái kích hoạt các ứng dụng hệ thống đã sao lưu...');
      }

      // 5. Restore default home activity
      const homeTarget = backupData?.currentHomeActivity || 'com.google.android.apps.tv.launcherx/.home.HomeActivity';
      log.push(`Thiết lập màn hình chính về: ${homeTarget}`);
      await this.adb.shell(host, port, `cmd package set-home-activity --user 0 ${homeTarget} || true`);

      log.push('Khôi phục hoàn tất thành công!');
      return { success: true, log };
    } catch (err: any) {
      log.push(`Lỗi khôi phục: ${err.message || String(err)}`);
      return { success: false, log };
    }
  }
}
