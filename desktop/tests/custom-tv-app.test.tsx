import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../src/renderer/src/App';

describe('Custom TV & App Integration', () => {
  it('allows user to navigate to TV selection tab and select Custom TV', async () => {
    // Mock window.tvApi
    window.tvApi = {
      pairTv: vi.fn(),
      connectTv: vi.fn().mockResolvedValue({ success: true, message: 'Connected' }),
      getDeviceInfo: vi.fn().mockResolvedValue({ model: 'Test TV' }),
      getProfiles: vi.fn().mockResolvedValue([]),
      scanPackages: vi.fn().mockResolvedValue([]),
      runPipeline: vi.fn().mockResolvedValue({ success: true, log: [] }),
      restoreStock: vi.fn().mockResolvedValue({ success: true, log: [] }),
      onLog: vi.fn().mockReturnValue(() => {})
    };

    await act(async () => {
      render(<App />);
    });

    // Click on TV profile selection tab on sidebar
    const selectTvTabBtn = screen.getByText('Chọn loại TV');
    await act(async () => {
      fireEvent.click(selectTvTabBtn);
    });

    // Verify 7th option is visible
    expect(screen.getByText('Tivi khác / Tự cấu hình')).toBeDefined();

    // Click Custom TV option
    await act(async () => {
      fireEvent.click(screen.getByText('Tivi khác / Tự cấu hình'));
    });

    // Check that custom TV options are now visible
    expect(screen.getByText('Bỏ qua Debloat (Khuyến nghị an toàn)')).toBeDefined();
    expect(screen.getByText('Debloat thủ công (Quét từ TV)')).toBeDefined();
    expect(screen.getByText('Tên model hoặc nhãn hiệu tivi của bạn:')).toBeDefined();

    // Switch to Debloat thủ công
    await act(async () => {
      fireEvent.click(screen.getByText('Debloat thủ công (Quét từ TV)'));
    });
    expect(screen.getByText('Quét và chọn ứng dụng trên TV...')).toBeDefined();
  });
});
