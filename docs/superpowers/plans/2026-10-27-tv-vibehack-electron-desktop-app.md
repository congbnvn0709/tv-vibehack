# TV ViBEHACK Electron Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng một ứng dụng Desktop đa nền tảng (Electron + React + TypeScript) cho macOS và Windows, giao diện tiếng Việt hiện đại theo chuẩn UI-UX Pro Max (Dark Slate Tech), cho phép người dùng non-IT dễ dàng kết nối Android TV không dây, sao lưu an toàn, gỡ app rác (debloat), cài đặt tvOS launcher kèm Kids Mode và khôi phục khi cần.

**Architecture:** Kiến trúc 3 tầng chuẩn Electron:
1. **Renderer (React + TypeScript + Tailwind/CSS Modules):** Giao diện Dashboard UI-UX Pro Max, quản lý trạng thái luồng cài đặt, công tắc bật/tắt tính năng, hiển thị nhật ký thời gian thực.
2. **Preload (ContextBridge IPC):** Cung cấp API an toàn, có kiểu dữ liệu (`window.tvApi`) giữa giao diện và hệ điều hành.
3. **Main Process (Node.js Services):**
   - `AdbService`: Tìm kiếm và tương tác trực tiếp với binary `adb` hệ thống, xử lý ghép nối TLS (Android 11+), kiểm tra kết nối, lấy thông tin TV.
   - `BackupService`: Trích xuất và lưu trạng thái TV (danh sách package, launcher mặc định, settings) vào file JSON an toàn.
   - `ProvisionService`: Thực thi debloat (hỗ trợ tự động fallback sang `pm suspend` khi gặp `SecurityException` trên Android 14), cài đặt launcher APK, cấp quyền Accessibility cho Kids Mode, xử lý bẫy `setupwraith` và set HOME.
   - `ProfileService`: Quét tự động danh mục profile có sẵn từ thư mục `examples/`.

**Tech Stack:**
- Runtime: Node.js (v20+), Electron (v33+)
- Bundler & Frontend: Vite, React 18, TypeScript, Phosphor SVG Icons
- Test Suite: Vitest (Unit tests cho các Node.js Main services và React components)
- Packaging: `electron-builder` (macOS `.dmg`, Windows `.exe`/NSIS)

**Spec:** Yêu cầu từ người dùng trong phiên trao đổi:
- Giao diện Dashboard một trang kèm Sidebar theo phong cách Dark Slate Tech / UI-UX Pro Max.
- Hỗ trợ cả macOS và Windows (tải về chạy luôn).
- Hỗ trợ các TV có sẵn profile trong `examples/` và chế độ tự chọn/quét cho mọi Android TV/Google TV.
- 2 chế độ: Chạy tự động tuần tự tối ưu hoặc Tùy chọn từng tính năng (Backup, Debloat, Launcher, Kids Mode).
- Luôn có tính năng Backup & Khôi phục launcher gốc an toàn.
- Tuân thủ các quy tắc phần cứng tại `.agents/rules/android-tv-workflow.md`.

---

## Global Constraints

- **Language:** Toàn bộ giao diện hiển thị tiếng Việt rõ ràng, thân thiện với người không rành kỹ thuật.
- **Iconography:** Tuyệt đối không dùng emoji làm biểu tượng chức năng; sử dụng vector SVG icons (Phosphor / Feather style).
- **Safety First:** Không bao giờ gỡ bỏ vĩnh viễn (`pm uninstall`); chỉ sử dụng `pm disable-user --user 0` hoặc `pm suspend`.
- **Android 14 Compatibility:** Xử lý triệt để bẫy `setupwraith` và lỗi `INSTALL_FAILED_VERIFICATION_FAILURE` thông qua ADB settings.
- **Code Directory:** Toàn bộ mã nguồn desktop app được đặt trong thư mục `desktop/`.

## Review Focus

1. **ADB Binary Resolution:** Nếu máy người dùng chưa có `adb` trong `PATH`, app phải tự kiểm tra các đường dẫn mặc định phổ biến (`/opt/homebrew/bin/adb`, Android SDK, Local Platform Tools) và hiển thị thông báo hướng dẫn rõ ràng thay vì crash.
2. **Android 11+ TLS Pairing Fallback:** Ghép nối không dây thành công sẽ lưu vĩnh viễn key tại `~/.android/adbkey`; lần sau kết nối chỉ cần gọi `adb connect <ip>:<port>`.
3. **SecurityException trên Android 14:** Khi `pm disable-user` bị từ chối quyền trên package hệ thống, hệ thống tự động fallback sang `pm suspend` mà không báo lỗi hỏng tiến trình.
4. **Recovery Activity Trap:** Sau khi vô hiệu hóa launcherx của Google TV, phải đảm bảo `com.google.android.tungsten.setupwraith` cũng bị vô hiệu hóa để tránh màn hình đen hoặc kẹt Recovery.
5. **Rollback Integrity:** File sao lưu JSON phải chứa đủ thông tin để nút "Khôi phục launcher gốc" có thể phục hồi 100% trạng thái ban đầu của TV chỉ với 1 click.

---

## Task Structure

### Task 1: Scaffolding Project Desktop với Vite + Electron + TypeScript + Vitest

**Files:**
- Create: `desktop/package.json`
- Create: `desktop/tsconfig.json`
- Create: `desktop/tsconfig.node.json`
- Create: `desktop/vite.config.ts`
- Create: `desktop/electron.vite.config.ts`
- Create: `desktop/src/main/index.ts`
- Create: `desktop/src/preload/index.ts`
- Create: `desktop/src/renderer/index.html`
- Create: `desktop/src/renderer/src/main.tsx`
- Create: `desktop/src/renderer/src/App.tsx`
- Test: `desktop/tests/scaffold.test.ts`

**Interfaces:**
- Produces: Môi trường build hoàn chỉnh chạy được `npm run dev`, `npm test`, và `npm run build`.

- [ ] **Step 1: Viết test kiểm tra cấu hình dự án scaffold**

```typescript
// desktop/tests/scaffold.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Scaffolding', () => {
  it('should have valid package.json with electron dependencies', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.name).toBe('tv-vibehack-desktop');
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test FAIL (chưa có thư mục `desktop`)**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack && npx vitest run desktop/tests/scaffold.test.ts`
Expected: FAIL (File not found)

- [ ] **Step 3: Khởi tạo thư mục `desktop/` và cài đặt các dependencies chuẩn**

Tạo `desktop/package.json` với Electron 33+, React 18, Vite, TypeScript, Vitest, Phosphor Icons.
Cài đặt dependencies bằng `npm install` trong `desktop/`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/
git commit -m "chore(desktop): scaffold Electron + Vite + React + Vitest project"
```

---

### Task 2: Dịch vụ ADB Engine (`AdbService`)

**Files:**
- Create: `desktop/src/main/services/adb-service.ts`
- Test: `desktop/tests/adb-service.test.ts`

**Interfaces:**
- Produces:
  ```typescript
  export interface AdbDeviceInfo {
    host: string;
    port: number;
    model: string;
    androidVersion: string;
    abi: string;
  }

  export class AdbService {
    findAdbPath(): Promise<string>;
    pair(host: string, port: number, code: string): Promise<{ success: boolean; message: string }>;
    connect(host: string, port: number): Promise<{ success: boolean; message: string }>;
    getDeviceInfo(host: string, port: number): Promise<AdbDeviceInfo>;
    shell(host: string, port: number, command: string): Promise<string>;
  }
  ```

- [ ] **Step 1: Viết test cho `AdbService`**

```typescript
// desktop/tests/adb-service.test.ts
import { describe, it, expect, vi } from 'vitest';
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
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/adb-service.test.ts`
Expected: FAIL (`AdbService` not found)

- [ ] **Step 3: Cài đặt `AdbService` trong `desktop/src/main/services/adb-service.ts`**

Triển khai logic:
- Tìm kiếm binary `adb` (`which adb`, `/opt/homebrew/bin/adb`, Android SDK).
- `buildDeviceArgs(host, port, args)`.
- `pair(host, port, code)` gọi `adb pair <host>:<port> <code>`.
- `connect(host, port)` gọi `adb connect <host>:<port>`.
- `shell(host, port, cmd)` thực thi lệnh và stream stdout.
- `parseDeviceInfo(rawOutput)`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/adb-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/main/services/adb-service.ts desktop/tests/adb-service.test.ts
git commit -m "feat(desktop): implement AdbService with TLS pairing and shell execution"
```

---

### Task 3: Dịch vụ Backup & Khôi phục (`BackupService`)

**Files:**
- Create: `desktop/src/main/services/backup-service.ts`
- Test: `desktop/tests/backup-service.test.ts`

**Interfaces:**
- Consumes: `AdbService`
- Produces:
  ```typescript
  export interface TvBackupData {
    timestamp: string;
    deviceModel: string;
    currentHomeActivity: string;
    disabledPackages: string[];
    suspendedPackages: string[];
    installedPackages: string[];
  }

  export class BackupService {
    createBackup(host: string, port: number, backupDir: string): Promise<TvBackupData>;
    restoreBackup(host: string, port: number, backupData: TvBackupData): Promise<{ success: boolean; log: string[] }>;
  }
  ```

- [ ] **Step 1: Viết test cho `BackupService`**

```typescript
// desktop/tests/backup-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { BackupService, TvBackupData } from '../src/main/services/backup-service';
import { AdbService } from '../src/main/services/adb-service';

describe('BackupService', () => {
  it('should parse package lists accurately from adb output', () => {
    const adbMock = {} as AdbService;
    const backup = new BackupService(adbMock);
    const raw = 'package:com.google.android.apps.tv.launcherx\npackage:com.smartdevice.myapp\n';
    const pkgs = backup.parsePackageList(raw);
    expect(pkgs).toEqual(['com.google.android.apps.tv.launcherx', 'com.smartdevice.myapp']);
  });

  it('should parse resolved home activity correctly', () => {
    const adbMock = {} as AdbService;
    const backup = new BackupService(adbMock);
    const raw = 'priority=0 preferredOrder=0 match=0x108000 specificIndex=-1 isDefault=true\ncom.google.android.apps.tv.launcherx/.home.HomeActivity';
    const home = backup.parseResolvedHome(raw);
    expect(home).toBe('com.google.android.apps.tv.launcherx/.home.HomeActivity');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/backup-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Triển khai `BackupService`**

- `parsePackageList` và `parseResolvedHome`.
- `createBackup`: chạy `pm list packages`, `pm list packages -d`, `cmd package resolve-activity`, lưu file JSON vào thư mục sao lưu.
- `restoreBackup`: kích hoạt lại các package đã disable (`pm enable`), unsuspend các package bị suspend (`pm unsuspend`), kích hoạt lại `com.google.android.tungsten.setupwraith`, khôi phục activity HOME.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/backup-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/main/services/backup-service.ts desktop/tests/backup-service.test.ts
git commit -m "feat(desktop): implement BackupService for state preservation and recovery"
```

---

### Task 4: Dịch vụ Debloat & Cài đặt Launcher (`ProvisionService`)

**Files:**
- Create: `desktop/src/main/services/profile-service.ts`
- Create: `desktop/src/main/services/provision-service.ts`
- Test: `desktop/tests/provision-service.test.ts`

**Interfaces:**
- Consumes: `AdbService`
- Produces:
  ```typescript
  export interface TvProfile {
    id: string;
    name: string;
    debloatListPath: string;
    packages: string[];
  }

  export class ProvisionService {
    applyDebloat(host: string, port: number, packages: string[], onProgress?: (msg: string) => void): Promise<{ disabled: string[]; suspended: string[]; failed: string[] }>;
    deployLauncher(host: string, port: number, apkPath: string, onProgress?: (msg: string) => void): Promise<boolean>;
    setupAccessibilityService(host: string, port: number): Promise<boolean>;
    setDefaultHome(host: string, port: number, launcherComponent: string): Promise<boolean>;
  }
  ```

- [ ] **Step 1: Viết test cho `ProfileService` & `ProvisionService`**

```typescript
// desktop/tests/provision-service.test.ts
import { describe, it, expect } from 'vitest';
import { ProfileService } from '../src/main/services/profile-service';
import path from 'path';

describe('ProfileService', () => {
  it('should parse debloat text files ignoring comments and empty lines', () => {
    const raw = '# Coocaa bloatware\ncom.smartdevice.myapp # store app\n\ncom.sky.market\n';
    const pkgs = ProfileService.parseDebloatLines(raw);
    expect(pkgs).toEqual(['com.smartdevice.myapp', 'com.sky.market']);
  });

  it('should discover supported profiles from examples directory', () => {
    const examplesDir = path.resolve(__dirname, '../../examples');
    const profiles = ProfileService.loadFromDirectory(examplesDir);
    expect(profiles.length).toBeGreaterThanOrEqual(5);
    const coocaa = profiles.find(p => p.id === 'coocaa-swtv-24ae-4k');
    expect(coocaa).toBeDefined();
    expect(coocaa?.packages.length).toBeGreaterThan(5);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/provision-service.test.ts`
Expected: FAIL

- [ ] **Step 3: Cài đặt `ProfileService` & `ProvisionService`**

Triển khai logic:
- `ProfileService`: đọc `examples/` và parse file `debloat.txt`.
- `applyDebloat`: duyệt từng package, chạy `pm disable-user --user 0 <pkg>`. Nếu output chứa `SecurityException`, tự động chuyển sang `pm suspend <pkg>` (áp dụng quy tắc Android 14).
- `deployLauncher`:
  - `settings put global package_verifier_enable 0`
  - `settings put global verifier_verify_adb_installs 0`
  - `adb install -r -t -d -g <apkPath>`
- `setupAccessibilityService`:
  - `pm grant com.gathin.tvhome android.permission.WRITE_SECURE_SETTINGS`
  - `settings put secure enabled_accessibility_services com.gathin.tvhome/.TvAccessibilityService`
  - `settings put secure accessibility_enabled 1`
- `setDefaultHome`:
  - Vô hiệu hóa `com.google.android.tungsten.setupwraith` nếu có.
  - Vô hiệu hóa `com.google.android.apps.tv.launcherx`.
  - `cmd package set-home-activity --user 0 com.gathin.tvhome/.MainActivity`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/provision-service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/main/services/profile-service.ts desktop/src/main/services/provision-service.ts desktop/tests/provision-service.test.ts
git commit -m "feat(desktop): implement ProfileService and ProvisionService with Android 14 safeguards"
```

---

### Task 5: Preload IPC Bridge & Electron Main Controller

**Files:**
- Create: `desktop/src/main/ipc-handlers.ts`
- Modify: `desktop/src/main/index.ts`
- Modify: `desktop/src/preload/index.ts`
- Create: `desktop/src/shared/types.ts`
- Test: `desktop/tests/ipc.test.ts`

**Interfaces:**
- Exposes to renderer:
  ```typescript
  window.tvApi = {
    pairTv: (host: string, port: number, code: string) => Promise<any>,
    connectTv: (host: string, port: number) => Promise<any>,
    getProfiles: () => Promise<TvProfile[]>,
    runPipeline: (options: RunPipelineOptions) => Promise<any>,
    restoreStock: () => Promise<any>,
    onLog: (callback: (log: string) => void) => () => void,
  }
  ```

- [ ] **Step 1: Viết test cho IPC definition & typing**

```typescript
// desktop/tests/ipc.test.ts
import { describe, it, expect } from 'vitest';
import { IPC_CHANNELS } from '../src/shared/types';

describe('IPC Channels', () => {
  it('should define distinct channel constants', () => {
    expect(IPC_CHANNELS.PAIR).toBe('tv:pair');
    expect(IPC_CHANNELS.CONNECT).toBe('tv:connect');
    expect(IPC_CHANNELS.RUN_PIPELINE).toBe('tv:run-pipeline');
    expect(IPC_CHANNELS.RESTORE).toBe('tv:restore');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/ipc.test.ts`
Expected: FAIL

- [ ] **Step 3: Hoàn thiện IPC Handlers và ContextBridge**

- Định nghĩa `IPC_CHANNELS` trong `desktop/src/shared/types.ts`.
- Gắn handlers vào `desktop/src/main/ipc-handlers.ts`.
- Cấu hình `desktop/src/preload/index.ts` với `contextBridge.exposeInMainWorld('tvApi', ...)`.
- Kết nối cửa sổ `BrowserWindow` trong `desktop/src/main/index.ts`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/ipc.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/shared/types.ts desktop/src/main/ipc-handlers.ts desktop/src/preload/index.ts desktop/src/main/index.ts desktop/tests/ipc.test.ts
git commit -m "feat(desktop): wire IPC communication bridge and preload API"
```

---

### Task 6: Giao diện Người dùng Pro Studio (React + UI-UX Pro Max)

**Files:**
- Create: `desktop/src/renderer/src/styles/theme.css`
- Create: `desktop/src/renderer/src/components/WindowHeader.tsx`
- Create: `desktop/src/renderer/src/components/Sidebar.tsx`
- Create: `desktop/src/renderer/src/components/ConnectModal.tsx`
- Create: `desktop/src/renderer/src/components/FeatureTile.tsx`
- Create: `desktop/src/renderer/src/components/ActionFooter.tsx`
- Create: `desktop/src/renderer/src/components/LogViewer.tsx`
- Modify: `desktop/src/renderer/src/App.tsx`
- Test: `desktop/tests/ui-components.test.tsx`

**Interfaces:**
- Giao diện trực quan hoá mockup `dashboard-pro-v2.html` với đầy đủ trạng thái:
  - Chọn model TV (Coocaa, Xiaomi, TCL...) hoặc TV bất kỳ.
  - Nhập IP + Cổng + Mã PIN ghép nối.
  - 4 Thẻ tính năng: Sao lưu, Debloat, Cài Launcher, Kids Mode.
  - Thanh tiến trình thực thi trực tiếp, hiển thị log dạng terminal.

- [ ] **Step 1: Viết test cho các component React chính**

```tsx
// desktop/tests/ui-components.test.tsx
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureTile } from '../src/renderer/src/components/FeatureTile';

describe('FeatureTile Component', () => {
  it('renders title, description and tag correctly', () => {
    render(
      <FeatureTile
        title="Sao lưu an toàn"
        description="Trích xuất dữ liệu gốc"
        tagText="Khuyến nghị"
        tagVariant="emerald"
        checked={true}
        onChange={() => {}}
      />
    );
    expect(screen.getByText('Sao lưu an toàn')).toBeDefined();
    expect(screen.getByText('Khuyến nghị')).toBeDefined();
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/ui-components.test.tsx`
Expected: FAIL

- [ ] **Step 3: Xây dựng các UI Components theo đúng thiết kế `dashboard-pro-v2.html`**

- `WindowHeader.tsx`: Nút điều khiển cửa sổ, logo thương hiệu, pill IP kèm hiệu ứng ripple animation.
- `Sidebar.tsx`: Navigation groups, icon Phosphor SVG, chip hiển thị thông số TV đã kết nối.
- `FeatureTile.tsx`: Thẻ tính năng phong cách OLED Slate Tech, switch toggle tương tác mượt mà.
- `ConnectModal.tsx`: Hướng dẫn bật gỡ lỗi không dây trên TV, ô nhập IP/Port/Pairing code.
- `LogViewer.tsx`: Terminal console hiển thị log ADB khi đang thực thi tiến trình.
- `ActionFooter.tsx`: Tóm tắt luồng và nút "Bắt đầu cài đặt ngay".

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/ui-components.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add desktop/src/renderer/ desktop/tests/ui-components.test.tsx
git commit -m "feat(desktop): implement Pro Studio UI components with Dark Slate theme"
```

---

### Task 7: Đóng gói Đa nền tảng (macOS `.dmg` & Windows `.exe`) và Kiểm thử Tích hợp

**Files:**
- Create: `desktop/electron-builder.yml`
- Modify: `desktop/package.json`
- Test: `desktop/tests/packaging.test.ts`

**Interfaces:**
- Produces: Các lệnh đóng gói `npm run dist:mac` và `npm run dist:win` tạo ra artifact phân phối độc lập.

- [ ] **Step 1: Viết test kiểm tra cấu hình đóng gói**

```typescript
// desktop/tests/packaging.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Electron Packaging Configuration', () => {
  it('should define targets for both mac and win in electron-builder config', () => {
    const configPath = path.resolve(__dirname, '../electron-builder.yml');
    expect(fs.existsSync(configPath)).toBe(true);
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('mac:');
    expect(content).toContain('win:');
    expect(content).toContain('extraResources:');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/packaging.test.ts`
Expected: FAIL

- [ ] **Step 3: Cấu hình `electron-builder.yml` và copy APK bundle**

- Cấu hình macOS: `dmg`, `zip`, arm64 + x64.
- Cấu hình Windows: `nsis`, `portable`, x64.
- Cấu hình `extraResources`: tích hợp file APK launcher từ `launcher/app/build/outputs/apk/debug/app-debug.apk` và thư mục `examples/`.
- Cấu hình scripts trong `desktop/package.json`.

- [ ] **Step 4: Chạy test để xác nhận PASS**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npx vitest run tests/packaging.test.ts`
Expected: PASS

- [ ] **Step 5: Chạy thử bản build Vite & Electron dry-run**

Run: `cd /Users/congcm/CODE/Vibe_Code/tv-vibehack/desktop && npm run build`
Expected: Thành công tạo ra thư mục `dist` không có lỗi cú pháp hay thiếu kiểu dữ liệu.

- [ ] **Step 6: Commit**

```bash
git add desktop/electron-builder.yml desktop/package.json desktop/tests/packaging.test.ts
git commit -m "chore(desktop): configure electron-builder for macOS and Windows releases"
```
