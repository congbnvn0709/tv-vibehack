import { AdbService } from './adb-service';

export interface ScannedPackage {
  packageName: string;
  isProtected: boolean;
  isRecommended: boolean;
  category: 'system-protected' | 'recommended' | 'user';
  description?: string;
}

export class PackageScannerService {
  private adb: AdbService;

  constructor(adb: AdbService) {
    this.adb = adb;
  }

  public static isProtectedPackage(pkg: string): boolean {
    const p = pkg.toLowerCase();

    // 1. Voice Search & Google Assistant
    if (
      p === 'com.google.android.katniss' ||
      p === 'com.google.android.speech.pumpkin' ||
      p === 'com.google.android.googlequicksearchbox' ||
      p.includes('voice') ||
      p.includes('assistant')
    ) {
      return true;
    }

    // 2. Chromecast & Media casting
    if (p === 'com.google.android.apps.mediashell' || p.includes('cast')) {
      return true;
    }

    // 3. Bluetooth Remote & Remotes
    if (
      p === 'com.google.android.tv.remote.service' ||
      p === 'com.android.bluetooth' ||
      p.includes('bluetooth') ||
      p.includes('remote') ||
      p.includes('rcu')
    ) {
      return true;
    }

    // 4. HDMI, Live TV, Tuner & Inputs
    if (
      p === 'com.android.tv' ||
      p === 'com.mediatek.tv.oneworld.tvcenter' ||
      p.includes('tvcenter') ||
      p.includes('tvsetting') ||
      p.includes('input') ||
      p.includes('hdmi')
    ) {
      return true;
    }

    // 5. Core Android system packages
    if (
      p === 'android' ||
      p === 'com.android.systemui' ||
      p === 'com.android.settings' ||
      p === 'com.android.packageinstaller' ||
      p === 'com.google.android.packageinstaller'
    ) {
      return true;
    }

    return false;
  }

  public static isRecommendedDebloat(pkg: string): boolean {
    if (this.isProtectedPackage(pkg)) return false;

    const p = pkg.toLowerCase();
    const bloatPatterns = [
      'com.smartdevice.',
      'com.sky.market',
      'com.miui.tv.',
      'com.xiaomi.statistic',
      'com.xiaomi.floatingframe',
      'com.tcl.tv.plus',
      'com.tcl.channelplus',
      'com.tcl.esticker',
      'com.tcl.exhibit',
      'com.google.android.videos',
      'com.google.android.play.games',
      'com.google.android.feedback',
      'retaildemo',
      'demo',
      'analytics',
      'recommendation'
    ];

    return bloatPatterns.some(pattern => p.includes(pattern));
  }

  public static classifyPackage(pkg: string): ScannedPackage {
    if (this.isProtectedPackage(pkg)) {
      let desc = 'Bảo vệ hệ thống';
      const p = pkg.toLowerCase();
      if (p.includes('katniss') || p.includes('speech') || p.includes('assistant')) desc = 'Tìm kiếm giọng nói / Assistant';
      else if (p.includes('mediashell') || p.includes('cast')) desc = 'Chromecast';
      else if (p.includes('remote') || p.includes('bluetooth')) desc = 'Điều khiển Bluetooth Remote';
      else if (p.includes('tv') || p.includes('input') || p.includes('hdmi')) desc = 'Cổng HDMI / Tín hiệu TV';

      return {
        packageName: pkg,
        isProtected: true,
        isRecommended: false,
        category: 'system-protected',
        description: desc
      };
    }

    if (this.isRecommendedDebloat(pkg)) {
      return {
        packageName: pkg,
        isProtected: false,
        isRecommended: true,
        category: 'recommended',
        description: 'Dịch vụ rác / quảng cáo của hãng'
      };
    }

    return {
      packageName: pkg,
      isProtected: false,
      isRecommended: false,
      category: 'user',
      description: 'Ứng dụng cài đặt'
    };
  }

  public async scanPackages(host: string, port: number): Promise<ScannedPackage[]> {
    const raw = await this.adb.shell(host, port, 'pm list packages');
    const lines = raw
      .split('\n')
      .map(l => l.trim().replace(/^package:/, ''))
      .filter(l => l.length > 0);

    const scanned = lines.map(pkg => PackageScannerService.classifyPackage(pkg));

    // Sort: Recommended first, then user apps, then protected at bottom
    return scanned.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      if (!a.isProtected && b.isProtected) return -1;
      if (a.isProtected && !b.isProtected) return 1;
      return a.packageName.localeCompare(b.packageName);
    });
  }
}
