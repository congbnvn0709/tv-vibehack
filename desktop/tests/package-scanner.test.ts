import { describe, it, expect } from 'vitest';
import { PackageScannerService } from '../src/main/services/package-scanner';

describe('PackageScannerService', () => {
  it('should identify Google Assistant and Voice Search as protected', () => {
    expect(PackageScannerService.isProtectedPackage('com.google.android.katniss')).toBe(true);
    expect(PackageScannerService.isProtectedPackage('com.google.android.speech.pumpkin')).toBe(true);
    expect(PackageScannerService.isProtectedPackage('com.google.android.googlequicksearchbox')).toBe(true);
  });

  it('should identify Chromecast as protected', () => {
    expect(PackageScannerService.isProtectedPackage('com.google.android.apps.mediashell')).toBe(true);
  });

  it('should identify Bluetooth Remote and HDMI services as protected', () => {
    expect(PackageScannerService.isProtectedPackage('com.google.android.tv.remote.service')).toBe(true);
    expect(PackageScannerService.isProtectedPackage('com.android.bluetooth')).toBe(true);
    expect(PackageScannerService.isProtectedPackage('com.mediatek.tv.oneworld.tvcenter')).toBe(true);
    expect(PackageScannerService.isProtectedPackage('com.android.tv')).toBe(true);
  });

  it('should identify bloatware as recommended for debloat but not protected', () => {
    expect(PackageScannerService.isProtectedPackage('com.smartdevice.myapp')).toBe(false);
    expect(PackageScannerService.isRecommendedDebloat('com.smartdevice.myapp')).toBe(true);
  });

  it('should classify packages properly', () => {
    const p1 = PackageScannerService.classifyPackage('com.google.android.katniss');
    expect(p1.isProtected).toBe(true);
    expect(p1.category).toBe('system-protected');

    const p2 = PackageScannerService.classifyPackage('com.smartdevice.myapp');
    expect(p2.isProtected).toBe(false);
    expect(p2.isRecommended).toBe(true);
    expect(p2.category).toBe('recommended');

    const p3 = PackageScannerService.classifyPackage('com.netflix.ninja');
    expect(p3.isProtected).toBe(false);
    expect(p3.category).toBe('user');
  });
});
