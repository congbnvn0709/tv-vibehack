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

  it('should correctly format IPv6 targets with brackets for ADB', () => {
    const adb = new AdbService();
    // Test IPv6 without brackets
    const ipv6Target = AdbService.formatTarget('2405:4802:90d0:dcd0:2270:5010:ab37:4cab', 5555);
    expect(ipv6Target).toBe('[2405:4802:90d0:dcd0:2270:5010:ab37:4cab]:5555');

    // Test IPv6 already with brackets
    const bracketedTarget = AdbService.formatTarget('[fd00:db80::2525:eb5f:ac60:5a86]', 5555);
    expect(bracketedTarget).toBe('[fd00:db80::2525:eb5f:ac60:5a86]:5555');

    // Test standard IPv4
    const ipv4Target = AdbService.formatTarget('192.168.1.50', 5555);
    expect(ipv4Target).toBe('192.168.1.50:5555');

    // Test buildDeviceArgs with IPv6
    const cmd = adb.buildDeviceArgs('2405:4802:90d0:dcd0:2270:5010:ab37:4cab', 5555, ['shell', 'getprop']);
    expect(cmd).toEqual(['-s', '[2405:4802:90d0:dcd0:2270:5010:ab37:4cab]:5555', 'shell', 'getprop']);
  });
});
