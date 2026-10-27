import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../src/renderer/src/App';
import { PackageScannerService } from '../src/main/services/package-scanner';

describe('New Coocaa Model (Unlisted Model) End-to-End Test', () => {
  it('correctly protects voice & HDMI when scanning a new Coocaa model TV', () => {
    // Simulated raw packages from a real Coocaa 55Y72 Google TV
    const mockCoocaaPackages = [
      'com.google.android.katniss',              // Voice Search (PROTECTED)
      'com.google.android.apps.mediashell',      // Chromecast (PROTECTED)
      'com.mediatek.tv.oneworld.tvcenter',       // HDMI Inputs (PROTECTED)
      'com.android.bluetooth',                   // Remote Bluetooth (PROTECTED)
      'com.coocaa.mall',                         // Bloat
      'com.coocaa.smartscreen',                  // Bloat
      'com.coocaa.usercenter',                   // Bloat
      'com.google.android.youtube.tv'            // Normal app
    ];

    const scanned = mockCoocaaPackages.map(pkg => PackageScannerService.classifyPackage(pkg));

    // 1. Verify protection
    const katniss = scanned.find(p => p.packageName === 'com.google.android.katniss');
    expect(katniss?.isProtected).toBe(true);
    expect(katniss?.description).toContain('giọng nói');

    const mediashell = scanned.find(p => p.packageName === 'com.google.android.apps.mediashell');
    expect(mediashell?.isProtected).toBe(true);
    expect(mediashell?.description).toContain('Chromecast');

    const tvcenter = scanned.find(p => p.packageName === 'com.mediatek.tv.oneworld.tvcenter');
    expect(tvcenter?.isProtected).toBe(true);
    expect(tvcenter?.description).toContain('HDMI');

    // 2. Verify Coocaa bloatware is not protected and can be removed
    const mall = scanned.find(p => p.packageName === 'com.coocaa.mall');
    expect(mall?.isProtected).toBe(false);
  });

  it('allows user to customize model name to "Coocaa 55Y72" and run debloat with safe selected apps', async () => {
    window.alert = vi.fn();
    const mockRunPipeline = vi.fn().mockResolvedValue({ success: true, log: ['Debloat success'] });
    const mockScanPackages = vi.fn().mockResolvedValue([
      { packageName: 'com.google.android.katniss', isProtected: true, isRecommended: false, category: 'system-protected', description: 'Voice Search' },
      { packageName: 'com.coocaa.mall', isProtected: false, isRecommended: true, category: 'recommended', description: 'Gợi ý gỡ' }
    ]);

    window.tvApi = {
      pairTv: vi.fn(),
      connectTv: vi.fn().mockResolvedValue({ success: true, message: 'Connected' }),
      getDeviceInfo: vi.fn().mockResolvedValue({ model: 'Coocaa 55Y72 Google TV' }),
      getProfiles: vi.fn().mockResolvedValue([]),
      scanPackages: mockScanPackages,
      runPipeline: mockRunPipeline,
      restoreStock: vi.fn().mockResolvedValue({ success: true, log: [] }),
      onLog: vi.fn().mockReturnValue(() => {})
    };

    await act(async () => {
      render(<App />);
    });

    // 0. Connect to TV first
    const connectStatusBtn = screen.getByText('Chưa kết nối TV');
    await act(async () => {
      fireEvent.click(connectStatusBtn);
    });

    const connectSubmitBtn = screen.getByRole('button', { name: /2\. Kết nối/i });
    await act(async () => {
      fireEvent.click(connectSubmitBtn);
    });

    // 1. Navigate to TV selection tab
    const selectTvTab = screen.getByText('Chọn loại TV');
    await act(async () => {
      fireEvent.click(selectTvTab);
    });

    // 2. Click "Tivi khác / Tự cấu hình"
    await act(async () => {
      fireEvent.click(screen.getByText('Tivi khác / Tự cấu hình'));
    });

    // 3. User types new Coocaa model name
    const modelInput = screen.getByPlaceholderText(/Ví dụ: Sony Bravia/i);
    await act(async () => {
      fireEvent.change(modelInput, { target: { value: 'Coocaa 55Y72 Google TV' } });
    });
    expect((modelInput as HTMLInputElement).value).toBe('Coocaa 55Y72 Google TV');

    // 4. Test Choice A: "Bỏ qua Debloat"
    await act(async () => {
      fireEvent.click(screen.getByText('Bỏ qua Debloat (Khuyến nghị an toàn)'));
    });

    // Trigger pipeline execution with "Bỏ qua Debloat"
    const executeBtn = screen.getByText('Bắt đầu cài đặt ngay');
    await act(async () => {
      fireEvent.click(executeBtn);
    });

    expect(mockRunPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedProfileId: 'custom-tv',
        doDebloat: false
      })
    );

    // 5. Test Choice B: Switch to "Debloat thủ công"
    mockRunPipeline.mockClear();

    // Go back to select-tv tab
    await act(async () => {
      fireEvent.click(selectTvTab);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Debloat thủ công (Quét từ TV)'));
    });

    // Click "Quét và chọn ứng dụng trên TV..."
    const scanBtn = screen.getByText('Quét và chọn ứng dụng trên TV...');
    await act(async () => {
      fireEvent.click(scanBtn);
    });

    expect(mockScanPackages).toHaveBeenCalled();

    // Verify modal appeared and lists packages
    expect(screen.getByText('Debloat thủ công (Quét trực tiếp từ TV)')).toBeDefined();
    expect(screen.getByText('com.google.android.katniss')).toBeDefined();
    expect(screen.getByText('com.coocaa.mall')).toBeDefined();

    // Click Save in modal
    const saveBtn = screen.getByText(/Lưu danh sách/i);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Now execute pipeline with manual debloat
    await act(async () => {
      fireEvent.click(screen.getByText('Bắt đầu cài đặt ngay'));
    });

    expect(mockRunPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedProfileId: 'custom-tv',
        doDebloat: true,
        customPackages: expect.arrayContaining(['com.coocaa.mall'])
      })
    );

    // Assert protected package was NOT sent in customPackages
    const lastCallOpts = mockRunPipeline.mock.calls[0][0];
    expect(lastCallOpts.customPackages).not.toContain('com.google.android.katniss');
  });
});
