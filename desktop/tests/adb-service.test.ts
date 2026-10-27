import { describe, it, expect } from 'vitest';
import { AdbService } from '../src/main/services/adb-service';

describe('AdbService', () => {
  it('should format shell command targeting specific device', async () => {
    const adb = new AdbService();
    const cmd = adb.buildDeviceArgs('192.168.1.21', 5555, ['shell', 'getprop', 'ro.product.model']);
    expect(cmd).toEqual(['-s', '192.168.1.21:5555', 'shell', 'getprop', 'ro.product.model']);
  });

  it('should parse device properties correctly', () => {
    const adb = new AdbService();
    const props = adb.parseDeviceInfo('Coocaa SWTV-24AE-4K\n14\narm64-v8a');
    expect(props.model).toBe('Coocaa SWTV-24AE-4K');
    expect(props.androidVersion).toBe('14');
    expect(props.abi).toBe('arm64-v8a');
  });

  it('should handle partial or dirty device info gracefully', () => {
    const adb = new AdbService();
    const props = adb.parseDeviceInfo('\r\nXiaomi Mi TV\r\n11\r\n');
    expect(props.model).toBe('Xiaomi Mi TV');
    expect(props.androidVersion).toBe('11');
    expect(props.abi).toBe('unknown');
  });
});
