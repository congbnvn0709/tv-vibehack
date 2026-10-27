import { ipcMain, BrowserWindow, app } from 'electron';
import path from 'path';
import { AdbService } from './services/adb-service';
import { BackupService } from './services/backup-service';
import { ProfileService } from './services/profile-service';
import { ProvisionService } from './services/provision-service';
import { IPC_CHANNELS, RunPipelineOptions } from '../shared/types';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  const adbService = new AdbService();
  const backupService = new BackupService(adbService);
  const provisionService = new ProvisionService(adbService);

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
    // Look up examples directory
    const repoExamples = path.resolve(app.getAppPath(), '../../examples');
    const fallbackExamples = path.resolve(app.getAppPath(), 'examples');
    const examplesDir = path.existsSync?.(repoExamples) ? repoExamples : fallbackExamples;
    return ProfileService.loadFromDirectory(examplesDir);
  });

  ipcMain.handle(IPC_CHANNELS.RESTORE, async (_event, host: string, port: number) => {
    return await backupService.restoreBackup(host, port, null);
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

        if (opts.selectedProfileId) {
          const repoExamples = path.resolve(app.getAppPath(), '../../examples');
          const profiles = ProfileService.loadFromDirectory(repoExamples);
          const found = profiles.find(p => p.id === opts.selectedProfileId);
          if (found) {
            packagesToDisable = found.packages;
          }
        } else if (opts.customPackages && opts.customPackages.length > 0) {
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
        // Standard path to debug APK in repo
        const defaultApk = path.resolve(
          app.getAppPath(),
          '../../launcher/app/build/outputs/apk/debug/app-debug.apk'
        );
        const packagedApk = path.resolve(process.resourcesPath, 'app-debug.apk');
        const finalApkPath = path.existsSync?.(defaultApk) ? defaultApk : packagedApk;

        pushLog(`Cài đặt APK từ: ${finalApkPath}`);
        const installed = await provisionService.deployLauncher(opts.host, opts.port, finalApkPath, pushLog);
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
