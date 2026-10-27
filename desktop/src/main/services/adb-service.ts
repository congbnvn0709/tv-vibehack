import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface AdbDeviceInfo {
  host: string;
  port: number;
  model: string;
  androidVersion: string;
  abi: string;
}

export type LogListener = (chunk: string) => void;

export class AdbService {
  private adbPath: string | null = null;
  private logListeners: Set<LogListener> = new Set();

  constructor(customAdbPath?: string) {
    if (customAdbPath && fs.existsSync(customAdbPath)) {
      this.adbPath = customAdbPath;
    }
  }

  public addLogListener(listener: LogListener): () => void {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private emitLog(log: string) {
    for (const listener of this.logListeners) {
      try {
        listener(log);
      } catch (err) {
        // ignore listener errors
      }
    }
  }

  public async findAdbPath(): Promise<string> {
    if (this.adbPath && fs.existsSync(this.adbPath)) {
      return this.adbPath;
    }

    const isWin = process.platform === 'win32';
    const binaryName = isWin ? 'adb.exe' : 'adb';

    // 1. Check PATH
    try {
      const whichCmd = isWin ? 'where' : 'which';
      const pathFromWhich = await new Promise<string>((resolve, reject) => {
        execFile(whichCmd, ['adb'], { timeout: 5000 }, (error, stdout) => {
          if (!error && stdout) {
            resolve(stdout.trim().split('\n')[0].trim());
          } else {
            reject(error);
          }
        });
      });
      if (pathFromWhich && fs.existsSync(pathFromWhich)) {
        this.adbPath = pathFromWhich;
        return this.adbPath;
      }
    } catch {
      // Continue search in well-known locations
    }

    // 2. Common fallback locations
    const candidatePaths: string[] = isWin
      ? [
          path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', binaryName),
          path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Android', 'platform-tools', binaryName),
          `C:\\platform-tools\\${binaryName}`
        ]
      : [
          '/opt/homebrew/bin/adb',
          '/usr/local/bin/adb',
          '/usr/bin/adb',
          path.join(process.env.HOME || '', 'Library/Android/sdk/platform-tools/adb'),
          path.join(process.env.HOME || '', 'Android/Sdk/platform-tools/adb')
        ];

    for (const cand of candidatePaths) {
      if (cand && fs.existsSync(cand)) {
        this.adbPath = cand;
        return this.adbPath;
      }
    }

    throw new Error('Không tìm thấy công cụ ADB trên máy tính. Vui lòng cài đặt Android Platform Tools hoặc thêm adb vào PATH.');
  }

  public buildDeviceArgs(host: string, port: number, args: string[]): string[] {
    const target = `${host}:${port}`;
    return ['-s', target, ...args];
  }

  public parseDeviceInfo(rawOutput: string): { model: string; androidVersion: string; abi: string } {
    const lines = rawOutput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    return {
      model: lines[0] || 'Unknown Android TV',
      androidVersion: lines[1] || 'Unknown',
      abi: lines[2] || 'unknown'
    };
  }

  public async execAdb(args: string[], timeoutMs = 30000): Promise<string> {
    const adb = await this.findAdbPath();
    this.emitLog(`$ adb ${args.join(' ')}\n`);

    return new Promise((resolve, reject) => {
      execFile(
        adb,
        args,
        {
          maxBuffer: 10 * 1024 * 1024,
          timeout: timeoutMs
        },
        (error, stdout, stderr) => {
          if (stdout) this.emitLog(stdout);
          if (stderr) this.emitLog(stderr);

          if (error) {
            reject(new Error(stderr || stdout || error.message));
          } else {
            resolve(stdout.trim());
          }
        }
      );
    });
  }

  public async pair(host: string, port: number, code: string): Promise<{ success: boolean; message: string }> {
    try {
      const output = await this.execAdb(['pair', `${host}:${port}`, code], 20000);
      const success = output.toLowerCase().includes('successfully paired');
      return { success, message: output };
    } catch (err: any) {
      return { success: false, message: err.message || String(err) };
    }
  }

  public async connect(host: string, port: number): Promise<{ success: boolean; message: string }> {
    try {
      const output = await this.execAdb(['connect', `${host}:${port}`], 15000);
      const success = output.toLowerCase().includes('connected') && !output.toLowerCase().includes('cannot connect');
      return { success, message: output };
    } catch (err: any) {
      return { success: false, message: err.message || String(err) };
    }
  }

  public async shell(host: string, port: number, command: string, timeoutMs = 30000): Promise<string> {
    const args = this.buildDeviceArgs(host, port, ['shell', command]);
    return await this.execAdb(args, timeoutMs);
  }

  public async getDeviceInfo(host: string, port: number): Promise<AdbDeviceInfo> {
    const infoCmd = 'getprop ro.product.model; getprop ro.build.version.release; getprop ro.product.cpu.abi';
    const output = await this.shell(host, port, infoCmd, 15000);
    const parsed = this.parseDeviceInfo(output);

    return {
      host,
      port,
      model: parsed.model,
      androidVersion: parsed.androidVersion,
      abi: parsed.abi
    };
  }
}
