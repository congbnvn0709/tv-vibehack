import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { AdbService } from './services/adb-service';
import { BackupService, TvBackupData } from './services/backup-service';
import { ProfileService } from './services/profile-service';
import { ProvisionService } from './services/provision-service';
import { PackageScannerService } from './services/package-scanner';
import { IPC_CHANNELS, RunPipelineOptions } from '../shared/types';
import { getResourcePaths } from './resource-helper';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  const adbService = new AdbService();
  const backupService = new BackupService(adbService);
  const provisionService = new ProvisionService(adbService);
  const scannerService = new PackageScannerService(adbService);

  // Broadcast adb logs to renderer
  adbService.addLogListener((logChunk: string) => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.ON_LOG, logChunk);
    }
  });

  ipcMain.handle(IPC_CHANNELS.PAIR, async (_event, host: string, port: number, code: string) => {
    return await adbService.pair(host, port, code);
  });

  ipcMain.handle(IPC_CHANNELS.CONNECT, async (_event, host: string, port: number) => {
    return await adbService.connect(host, port);
  });

  ipcMain.handle(IPC_CHANNELS.GET_DEVICE_INFO, async (_event, host: string, port: number) => {
    return await adbService.getDeviceInfo(host, port);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PROFILES, async () => {
    const { examplesDir } = getResourcePaths(app.getAppPath(), app.isPackaged);
    return ProfileService.loadFromDirectory(examplesDir);
  });

  ipcMain.handle(IPC_CHANNELS.SCAN_PACKAGES, async (_event, host: string, port: number) => {
    return await scannerService.scanPackages(host, port);
  });

  ipcMain.handle(IPC_CHANNELS.RESTORE, async (_event, host: string, port: number) => {
    const latestPath = path.join(app.getPath('userData'), 'tv_backups', 'latest_backup.json');
    let backupData: TvBackupData | null = null;
    if (fs.existsSync(latestPath)) {
      try {
        backupData = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      } catch {
        // ignore parse error
      }
    }
    return await backupService.restoreBackup(host, port, backupData);
  });

  ipcMain.handle(IPC_CHANNELS.RUN_PIPELINE, async (_event, opts: RunPipelineOptions) => {
    const log: string[] = [];
    const pushLog = (m: string) => {
      log.push(m);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.ON_LOG, m + '\n');
      }
    };

    try {
      pushLog(`=== BẮT ĐẦU TIẾN TRÌNH CÀI ĐẶT CHO TV ${opts.host}:${opts.port} ===`);

      // 1. BACKUP
      if (opts.doBackup) {
        pushLog('Đang tiến hành sao lưu cấu hình TV...');
        const backupDir = path.resolve(app.getPath('userData'), 'tv_backups');
        await backupService.createBackup(opts.host, opts.port, backupDir);
        pushLog('✓ Sao lưu dữ liệu an toàn thành công!');
      }

      // 2. DEBLOAT
      if (opts.doDebloat) {
        pushLog('Đang tiến hành dọn dẹp các ứng dụng chạy ngầm (Debloat)...');
        let packagesToDisable: string[] = [];

        if (opts.selectedProfileId && opts.selectedProfileId !== 'custom-tv') {
          const { examplesDir } = getResourcePaths(app.getAppPath(), app.isPackaged);
          const profiles = ProfileService.loadFromDirectory(examplesDir);
          const found = profiles.find(p => p.id === opts.selectedProfileId);
          if (found) {
            packagesToDisable = found.packages;
          }
        }

        if (packagesToDisable.length === 0 && opts.customPackages && opts.customPackages.length > 0) {
          packagesToDisable = opts.customPackages;
        }

        if (packagesToDisable.length > 0) {
          const debloatRes = await provisionService.applyDebloat(
            opts.host,
            opts.port,
            packagesToDisable,
            pushLog
          );
          pushLog(`✓ Đã vô hiệu hóa: ${debloatRes.disabled.length} gói, đóng băng: ${debloatRes.suspended.length} gói.`);
        } else {
          pushLog('Bỏ qua Debloat do không có danh sách ứng dụng phù hợp.');
        }
      }

      // 3. INSTALL LAUNCHER
      if (opts.doInstallLauncher) {
        pushLog('Đang định vị file APK Launcher...');
        const { apkPath } = getResourcePaths(app.getAppPath(), app.isPackaged);

        pushLog(`Cài đặt APK từ: ${apkPath}`);
        if (!fs.existsSync(apkPath)) {
          throw new Error(`Không tìm thấy file APK tại: ${apkPath}`);
        }

        const installed = await provisionService.deployLauncher(opts.host, opts.port, apkPath, pushLog);
        if (!installed) {
          throw new Error('Cài đặt file APK thất bại qua ADB.');
        }
        pushLog('✓ Cài đặt Launcher tvOS thành công.');

        // 4. KIDS MODE ACCESSIBILITY PROVISIONING
        if (opts.enableKidsMode) {
          pushLog('Kích hoạt dịch vụ trợ năng (Accessibility) và quyền hẹn giờ cho Kids Mode...');
          await provisionService.setupAccessibilityService(opts.host, opts.port);
          pushLog('✓ Cấp quyền Kids Mode hoàn tất.');
        }

        // 5. SET DEFAULT HOME
        pushLog('Thiết lập tvOS Launcher làm màn hình chính (HOME)...');
        await provisionService.setDefaultHome(opts.host, opts.port);
        pushLog('✓ Đã kích hoạt tvOS Launcher làm màn hình chính mặc định.');
      }

      pushLog('=== TẤT CẢ TÁC VỤ HOÀN TẤT THÀNH CÔNG ===');
      return { success: true, log };
    } catch (err: any) {
      pushLog(`❌ Lỗi trong quá trình thực thi: ${err.message || String(err)}`);
      return { success: false, log };
    }
  });
}
