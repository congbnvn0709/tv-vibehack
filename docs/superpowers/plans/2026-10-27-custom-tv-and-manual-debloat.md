# Custom TV Model & Safe Manual Debloat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm tính năng cho phép người dùng nhập model TV riêng hoặc tự động nhận diện từ TV, hỗ trợ 2 lựa chọn (Bỏ qua Debloat hoặc Debloat thủ công), tích hợp cơ chế bảo vệ tuyệt đối (Whitelist Protection) khóa cứng các tính năng cốt lõi: Tìm kiếm giọng nói, Google Assistant, Chromecast, Bluetooth Remote và HDMI.

**Architecture:**
1. **Backend Service (`PackageScannerService`):** Quét danh sách package từ TV qua ADB (`pm list packages`), đối chiếu với bộ quy tắc Whitelist bảo vệ hệ thống (`isProtected`) và danh sách bloatware phổ biến (`isRecommended`).
2. **IPC Bridge:** Bổ sung kênh `tv:scan-packages` và cập nhật kiểu dữ liệu trong `shared/types.ts`.
3. **Frontend Component (`ManualDebloatModal` & `App.tsx`):** Thêm thẻ "➕ Tivi khác", 2 nút radio (Bỏ qua Debloat / Debloat thủ công), modal danh sách app có ô tìm kiếm, hiển thị huy hiệu khiên bảo vệ `🛡️ Bảo vệ hệ thống` và khóa checkbox cho các app nhạy cảm.

**Tech Stack:** React 18, TypeScript, Electron IPC, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-custom-tv-and-manual-debloat-design.md`

## Global Constraints
- **Absolute Safeguard:** Không bao giờ cho phép người dùng tắt các package Voice Search, Google Assistant, Chromecast, Bluetooth Remote và cổng HDMI / TV input.
- **Language:** Toàn bộ giao diện và thông báo bằng tiếng Việt dễ hiểu.
- **Iconography:** Sử dụng vector SVG icons, không dùng emoji cho các nút bấm.

## Review Focus
1. **Whitelist Coverage:** Đảm bảo `katniss`, `googlequicksearchbox`, `mediashell`, các gói bluetooth, remote và HDMI đều được nhận diện `isProtected = true`.
2. **UI Lock Enforcement:** Trên giao diện, các package `isProtected` phải bị `disabled` thuộc tính input/checkbox, không thể bị tick dù người dùng thao tác nhanh.
3. **Empty / Offline TV Fallback:** Nếu TV chưa kết nối hoặc lệnh quét thất bại, hệ thống hiển thị thông báo hướng dẫn kết nối rõ ràng thay vì văng lỗi.

---

## Task Structure

### Task 1: Package Scanner Service & Whitelist Classification Engine

**Files:**
- Create: `desktop/src/main/services/package-scanner.ts`
- Test: `desktop/tests/package-scanner.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface ScannedPackage {
    packageName: string;
    isProtected: boolean;
    isRecommended: boolean;
    category: 'system-protected' | 'recommended' | 'user';
    description?: string;
  }

  export class PackageScannerService {
    static isProtectedPackage(pkg: string): boolean;
    static isRecommendedDebloat(pkg: string): boolean;
    static classifyPackage(pkg: string): ScannedPackage;
    scanPackages(host: string, port: number): Promise<ScannedPackage[]>;
  }
  ```

- [ ] **Step 1: Viết test cho `PackageScannerService`**

```typescript
// desktop/tests/package-scanner.test.ts
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
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd desktop && npm test tests/package-scanner.test.ts`
Expected: FAIL

- [ ] **Step 3: Triển khai `PackageScannerService` trong `desktop/src/main/services/package-scanner.ts`**

- Định nghĩa regex & danh sách whitelist cho Assistant, Cast, Remote, HDMI.
- Định nghĩa danh sách các gói rác phổ biến (`isRecommended`).
- Phương thức `scanPackages(host, port)` gọi `adb shell pm list packages`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd desktop && npm test tests/package-scanner.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/main/services/package-scanner.ts desktop/tests/package-scanner.test.ts
git commit -m "feat(desktop): implement PackageScannerService with system whitelist protection"
```

---

### Task 2: IPC Channels & Wiring for Package Scanning

**Files:**
- Modify: `desktop/src/shared/types.ts`
- Modify: `desktop/src/main/ipc-handlers.ts`
- Modify: `desktop/src/preload/index.ts`
- Test: `desktop/tests/scan-ipc.test.ts`

**Interfaces:**
- Exposes: `window.tvApi.scanPackages(host, port): Promise<ScannedPackage[]>`

- [ ] **Step 1: Viết test cho IPC definition của scan-packages**

```typescript
// desktop/tests/scan-ipc.test.ts
import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS } from '../src/shared/types';

describe('Scan IPC Channels', () => {
  it('should define SCAN_PACKAGES channel constant', () => {
    expect(IPC_CHANNELS.SCAN_PACKAGES).toBe('tv:scan-packages');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd desktop && npm test tests/scan-ipc.test.ts`
Expected: FAIL

- [ ] **Step 3: Cập nhật types, ipc-handlers và preload**

- Thêm `SCAN_PACKAGES: 'tv:scan-packages'` vào `IPC_CHANNELS`.
- Thêm `scanPackages` handler vào `ipc-handlers.ts` gọi `PackageScannerService`.
- Expose hàm qua `preload/index.ts`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd desktop && npm test tests/scan-ipc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/types.ts desktop/src/main/ipc-handlers.ts desktop/src/preload/index.ts desktop/tests/scan-ipc.test.ts
git commit -m "feat(desktop): add tv:scan-packages IPC channel and preload mapping"
```

---

### Task 3: UI Component `ManualDebloatModal` & Cập nhật Chọn TV

**Files:**
- Create: `desktop/src/renderer/src/components/ManualDebloatModal.tsx`
- Modify: `desktop/src/renderer/src/App.tsx`
- Test: `desktop/tests/manual-debloat-ui.test.tsx`

**Interfaces:**
- Thẻ "➕ Tivi khác (Tự cấu hình)" trong `select-tv`.
- Modal danh sách app có:
  - Thanh tìm kiếm theo tên package.
  - Danh sách phân loại rõ: Được bảo vệ (icon khiên xanh 🛡️, disabled checkbox) vs Có thể tắt.
  - Nút lưu cấu hình debloat thủ công.

- [ ] **Step 1: Viết test cho `ManualDebloatModal`**

```tsx
// desktop/tests/manual-debloat-ui.test.tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ManualDebloatModal } from '../src/renderer/src/components/ManualDebloatModal';

describe('ManualDebloatModal', () => {
  it('renders protected packages as disabled checkboxes with shield', () => {
    const packages = [
      { packageName: 'com.google.android.katniss', isProtected: true, isRecommended: false, category: 'system-protected' as const },
      { packageName: 'com.smartdevice.myapp', isProtected: false, isRecommended: true, category: 'recommended' as const }
    ];

    render(
      <ManualDebloatModal
        isOpen={true}
        onClose={() => {}}
        packages={packages}
        selectedPackages={['com.smartdevice.myapp']}
        onTogglePackage={() => {}}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('com.google.android.katniss')).toBeDefined();
    expect(screen.getByText('Bảo vệ hệ thống')).toBeDefined();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd desktop && npm test tests/manual-debloat-ui.test.tsx`
Expected: FAIL

- [ ] **Step 3: Xây dựng `ManualDebloatModal.tsx` và gắn vào `App.tsx`**

- `ManualDebloatModal`: Bộ lọc tìm kiếm, hiển thị nhãn "Bảo vệ hệ thống (Voice/HDMI/Remote)", vô hiệu hóa checkbox cho app bảo vệ.
- `App.tsx`: Thêm thẻ "➕ Tivi khác (Tùy chỉnh)", cho phép nhập tên TV tùy thích và chọn giữa "Bỏ qua Debloat" và "Debloat thủ công".

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd desktop && npm test tests/manual-debloat-ui.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/renderer/src/components/ManualDebloatModal.tsx desktop/src/renderer/src/App.tsx desktop/tests/manual-debloat-ui.test.tsx
git commit -m "feat(desktop): add Custom TV selection and ManualDebloatModal with protected tags"
```

---

### Task 4: Kiểm thử toàn diện & Biên dịch bản phát hành

**Files:**
- Test: `desktop/tests/` (Chạy toàn bộ test suite)

- [ ] **Step 1: Chạy toàn bộ test suite Vitest**

Run: `cd desktop && npm test`
Expected: 100% test files PASS (không có lỗi)

- [ ] **Step 2: Chạy `npm run build` để kiểm tra đóng gói Vite và Electron**

Run: `cd desktop && npm run build`
Expected: Build thành công không có lỗi TypeScript

- [ ] **Step 3: Commit hoàn tất tính năng**

```bash
git add -A
git commit -m "feat(desktop): complete custom TV model flow and safe manual debloat"
```
