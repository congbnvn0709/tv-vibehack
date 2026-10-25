# Coocaa TV Debloat and Kids Mode Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Debloat the Coocaa / Skyworth SWTV-24AE-4K TV (Android 14) and build/deploy a lightweight tvOS-inspired launcher featuring a custom dock (YouTube, VTV Go, Netflix, HBO Max) and an integrated Kids Mode sleep timer with PIN-protected lock screen.

**Architecture:** Debloat scripts safely freeze vendor telemetry and unneeded bloat via ADB. The native Java launcher (`com.gathin.tvhome`) is configured with the 4 dock apps, while `KidsModeManager` manages PIN state and session timers. `TvAccessibilityService` intercepts global hardware keys when locked and handles putting the screen to sleep (`GLOBAL_ACTION_LOCK_SCREEN`) when the timer expires.

**Tech Stack:** Java, Android SDK 34, AndroidX, Gradle, ADB shell commands, Pure-Python ADB client.

**Spec:** [`docs/superpowers/specs/2026-10-24-coocaa-debloat-and-kids-mode-launcher-design.md`](docs/superpowers/specs/2026-10-24-coocaa-debloat-and-kids-mode-launcher-design.md)

## Global Constraints

- Device IP: `192.168.1.21:5555`
- Target Model: Coocaa / Skyworth SWTV-24AE-4K (`eleonas`), Android 14 (API 34)
- Package disabling: Always use `pm disable-user --user 0`, never uninstall system packages.
- Protected apps: Never disable inputs, HDMI, Bluetooth remote (`smartdevice.bleconnectservice`, `duplebluetooth`), TV tuner (`mediatek.tv.oneworld.tvcenter`), Google Assistant (`com.google.android.katniss`), Chromecast (`com.google.android.apps.mediashell`), Play Store (`com.android.vending`).
- Unlock behavior: Entering correct PIN resets `is_locked` to false, cancels timer, and restores normal TV operation.

## Review Focus

1. **Active Foreground Video When Timer Expires:** TV must issue `GLOBAL_ACTION_HOME` then `GLOBAL_ACTION_LOCK_SCREEN` so the TV sleeps and wakes up into the launcher's lock screen.
2. **App Shortcut Remote Buttons When Locked:** Dedicated Netflix/YouTube remote keys must be consumed by `TvAccessibilityService` when `is_locked == true` so kids cannot bypass the lock.
3. **Accessibility Permission on Android 14:** Granted directly via ADB commands (`settings put secure enabled_accessibility_services`).
4. **Dock App Availability:** Fallback gracefully if any dock app is missing without crashing.
5. **Emergency Rescue:** PIN reset possible via ADB without reinstalling (`pm clear com.gathin.tvhome`).

---

### Task 1: Debloat and Restore Scripts for Coocaa TV

**Files:**
- Create: `examples/coocaa-swtv-24ae-4k/debloat.txt`
- Create: `tools/restore-coocaa.sh`

- [ ] **Step 1: Create debloat list for Coocaa TV**
Write `examples/coocaa-swtv-24ae-4k/debloat.txt` containing manufacturer telemetry, ads, and unneeded packages (`com.smartdevice.recommendation`, `recordactivation`, `dailymanage`, `dailyshortcut`, `aftersale`, `emanual`, `myapp`, `factory`, `sky.market`, `leanbacklauncher.customizer`, `retaildemo`, `mercadolibre.android.mplay_tv`, `google.android.feedback`).

- [ ] **Step 2: Create restore script**
Write `tools/restore-coocaa.sh` to re-enable all debloated packages and the default Google TV launcher (`com.google.android.apps.tv.launcherx`).

- [ ] **Step 3: Execute debloat on real TV over ADB**
Run `pm disable-user --user 0` for each package in `examples/coocaa-swtv-24ae-4k/debloat.txt` on `192.168.1.21:5555`.

- [ ] **Step 4: Verify device responsiveness and core services**
Run `adb shell pm list packages -d` to verify disabled packages, and confirm voice search, casting, and HDMI services are untouched.

- [ ] **Step 5: Commit**
`git add examples/coocaa-swtv-24ae-4k/ tools/restore-coocaa.sh && git commit -m "feat: add debloat and restore scripts for Coocaa SWTV-24AE-4K"`

---

### Task 2: Configure Launcher Dock & Live TV Settings

**Files:**
- Modify: `launcher/app/src/main/res/values/config.xml`

- [ ] **Step 1: Update dock apps and Live TV package in config.xml**
Set dock apps to:
- `com.google.android.youtube.tv`
- `vn.vtv.vtvgotv`
- `com.netflix.ninja`
- `com.wbd.stream`
Set `live_tv_package` to `com.mediatek.tv.oneworld.tvcenter`.
Set `columns` to 4.

- [ ] **Step 2: Commit**
`git add launcher/app/src/main/res/values/config.xml && git commit -m "feat: configure dock apps and live tv package for Coocaa TV"`

---

### Task 3: Implement Kids Mode Manager & Service Key Interception

**Files:**
- Create: `launcher/app/src/main/java/com/gathin/tvhome/KidsModeManager.java`
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/TvAccessibilityService.java`

- [ ] **Step 1: Create `KidsModeManager.java`**
Implement PIN hashing (SHA-256), PIN verification, timer scheduling (15m, 30m, 45m, 60m), wall-clock timestamp tracking (`target_sleep_timestamp`), state persistence in `SharedPreferences ("kids_mode_prefs")`, and unlock logic (resets `is_locked = false`, clears timer).

- [ ] **Step 2: Update `TvAccessibilityService.java`**
- Remove legacy Stremio launch logic.
- Add static instance reference so `KidsModeManager` can trigger `performGlobalAction(GLOBAL_ACTION_HOME)` and `performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)`.
- In `onKeyEvent()`, check if `KidsModeManager.isLocked(context)` is true. If locked, consume key events for external app launches and remote shortcuts (Netflix, YouTube, Prime keys) while allowing numbers (0-9), D-pad navigation, and OK/Back for PIN entry.

- [ ] **Step 3: Commit**
`git add launcher/app/src/main/java/com/gathin/tvhome/KidsModeManager.java launcher/app/src/main/java/com/gathin/tvhome/TvAccessibilityService.java && git commit -m "feat: add KidsModeManager and update TvAccessibilityService"`

---

### Task 4: Kids Mode UI (Top Bar Pill, Timer Popup & Frosted Lock Screen)

**Files:**
- Create: `launcher/app/src/main/res/layout/popup_kids_mode.xml`
- Create: `launcher/app/src/main/res/layout/overlay_kids_lock.xml`
- Modify: `launcher/app/src/main/res/layout/activity_main.xml`
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`

- [ ] **Step 1: Create `popup_kids_mode.xml`**
Layout with frosted glass styling containing quick duration presets (15m, 30m, 45m, 60m, Tắt), remaining time countdown display, and Change PIN option.

- [ ] **Step 2: Create `overlay_kids_lock.xml`**
Full-screen frosted glass lock screen containing bedtime icon, message ("Đã hết giờ xem TV! Bé hãy nghỉ ngơi hoặc nhờ bố mẹ mở khóa"), 4-digit PIN indicator (`● ● ● ●`), and D-pad friendly 0-9 numeric pad.

- [ ] **Step 3: Update `activity_main.xml` and `MainActivity.java`**
- Add `btnKidsMode` pill to top bar next to Settings/Calendar.
- Implement popup opening for `btnKidsMode` with PIN challenge.
- In `MainActivity.onResume()` and periodic minute tick, check `KidsModeManager.isLocked()`. If locked or timer expired, display the lock overlay immediately, blocking focus to app tiles.
- Implement PIN submission: when correct PIN is entered, dismiss lock screen, reset timer to OFF, and restore normal TV operation.

- [ ] **Step 4: Commit**
`git add launcher/app/src/main/res/ launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java && git commit -m "feat: add Kids Mode UI dialogs, top bar pill, and lock screen overlay"`

---

### Task 5: Compile, Install APK & Provision Permissions

**Files:**
- Script: `launcher/build-and-install.sh`

- [ ] **Step 1: Compile launcher APK**
Run `./gradlew assembleDebug` in `launcher/` directory.

- [ ] **Step 2: Install APK to Coocaa TV**
Push and install `app-debug.apk` to TV via ADB (`adb install -r launcher/app/build/outputs/apk/debug/app-debug.apk`).

- [ ] **Step 3: Provision Accessibility Permission via ADB**
Execute:
`adb shell settings put secure enabled_accessibility_services com.gathin.tvhome/.TvAccessibilityService`
`adb shell settings put secure accessibility_enabled 1`

- [ ] **Step 4: Set as default Home launcher and disable stock launcher**
Run:
`adb shell cmd package set-home-activity com.gathin.tvhome/.MainActivity`
`adb shell pm disable-user --user 0 com.google.android.apps.tv.launcherx`

- [ ] **Step 5: Commit**
`git add -A && git commit -m "feat: complete build and deployment configuration"`

---

### Task 6: End-to-End Verification on Real TV

- [ ] **Step 1: Verify launcher launch & dock apps**
Capture screenshot via `adb shell screencap -p /sdcard/home.png` and pull to verify the 4 dock apps (YouTube, VTV Go, Netflix, HBO Max) and top bar pills.

- [ ] **Step 2: Verify Kids Mode timer and lock screen**
Test setting a 1-minute test timer or manual lock, verify sleep trigger, wake TV up, verify lock screen overlay appears and blocks shortcuts, then enter PIN to verify normal operation returns.

- [ ] **Step 3: Capture final verification screenshots and clean temporary test files**
Verify TV responsiveness and confirm completion.
