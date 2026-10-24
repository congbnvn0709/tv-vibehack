# Design Document: Coocaa TV Debloat and Kids Mode tvOS Launcher

**Date:** 2026-10-24  
**Target Device:** Coocaa / Skyworth `SWTV-24AE-4K` (`eleonas`), Android 14 (API 34)  
**Status:** In Review  

---

## 1. Intent and Why

The user has an Android 14 Coocaa / Skyworth Smart TV that suffers from OEM bloatware, telemetry, sluggish default Google TV launcher ads, and lacks a native, friction-free way to limit TV viewing time for children. 

The goal is to:
1. Safely debloat telemetry, manufacturer recommendations, and unneeded regional apps while strictly preserving hardware inputs (HDMI/AV), remote control functions, voice search (Google Assistant), casting (Chromecast), and the Google Play Store.
2. Configure and deploy a fast, lightweight tvOS-inspired launcher (`tv-vibehack`).
3. Pin the user's 4 preferred entertainment apps to the primary dock: YouTube, VTV Go, Netflix, and HBO Max.
4. Add a built-in **Kids Mode & Sleep Timer** feature directly into the launcher with 4-digit PIN protection, selectable session countdown (e.g. 15, 30, 45, 60 mins), automatic TV sleep/screen lock upon timer expiry, and a persistent lock screen until parent unlocks with the PIN.

---

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- **Full Reversibility:** All disabled packages must be stored in a backup folder (`backups/coocaa-swtv-24ae-4k/`) with an executable restore script `tools/restore-coocaa.sh`.
- **Zero Breakage:** Never disable HDMI inputs, TV tuner services, Bluetooth remote pairing, on-screen keyboard, or system core frameworks.
- **Snappy Performance:** Launcher must remain under 60MB RAM footprint, suitable for budget TV chipsets.
- **Kids Sleep Timer:**
  - Fast parental setup accessible via a top-bar pill button.
  - Protected by a 4-digit PIN (default setup on first use, changeable with old PIN).
  - Presets: 15m, 30m, 45m, 60m, or Off.
  - When timer reaches 0: puts TV display into sleep (`GLOBAL_ACTION_LOCK_SCREEN` via AccessibilityService).
  - When TV wakes up or while timer is expired: displays a frosted glass Lock Screen overlay requiring PIN entry to access any launcher tile or open apps.
  - D-pad friendly PIN keypad (0-9) that also supports remote physical number buttons if present.
- **Dock Order:** Exactly `[YouTube, VTV Go, Netflix, HBO Max]` with Live TV / Inputs accessible via the Inputs pill.

### Non-Goals
- Cloud-based parental control sync or mobile app sync.
- Per-app complex time usage analytics.
- Deleting OEM packages via root (only user disable via `pm disable-user --user 0`).

### Anti-Goals
- Do not brick HDMI port switching or Live TV reception.
- Do not install heavy background analytics or battery/memory monitoring daemons.
- Do not lock the parent out: provide a fallback recovery mechanism via ADB shell if PIN is forgotten.

---

## 3. Constraints

- **Hardware/OS:** Android 14 (API 34), limited RAM (~1.5GB - 2GB total), Quad-core ARM processor.
- **Input Method:** 10-foot TV UI navigated exclusively via D-pad remote (Up, Down, Left, Right, OK, Back, Home).
- **Permissions:** The launcher can run as the default `HOME` activity and utilize `TvAccessibilityService` (already in the project) for global system actions like `GLOBAL_ACTION_LOCK_SCREEN`.

---

## 4. Approaches Considered

### Approach 1 (Selected): Built-in Kids Timer & Lock Screen via Launcher + AccessibilityService
- **Description:** Implement the timer countdown and frosted lock screen directly within the `tv-vibehack` launcher codebase. Utilize `TvAccessibilityService.performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)` to put TV to sleep upon expiry. Display a full-screen modal lock screen with 4-digit PIN pad if the timer has expired or lock is engaged.
- **Trade-offs:** Requires modifying `MainActivity.java`, adding `KidsModeManager.java`, and layout/overlay resources. Completely offline, zero subscription, instantaneous, adheres to the tvOS frosted glass aesthetic, zero background drain.
- **Decision:** Selected by user.

### Approach 2: Third-party Parental Control App from Play Store
- **Description:** Install Google Family Link or commercial TV time limiter apps.
- **Trade-offs:** Bloated, requires external accounts, background services often killed by Android low-memory killer, potential recurring subscription fees, disjointed UI.
- **Decision:** Rejected.

---

## 5. Architectural & Implementation Specifications

### 5.1 Debloat List (`examples/coocaa-swtv-24ae-4k/debloat.txt`)
Packages to safely disable:
```text
# Manufacturer recommendations, telemetry, demo
com.smartdevice.recommendation
com.smartdevice.recordactivation
com.smartdevice.dailymanage
com.smartdevice.dailyshortcut
com.smartdevice.aftersale
com.Smartdevice.emanual
com.smartdevice.myapp
com.smartdevice.factory
com.sky.market
com.smartdevice.leanbacklauncher.customizer
com.mediatek.tv.retaildemo

# Unused regional third-party preloaded apps
com.mercadolibre.android.mplay_tv

# Feedback / background reporting
com.google.android.feedback
```

Packages strictly kept active:
- `com.google.android.katniss` (Google Assistant / Voice Search)
- `com.google.android.apps.mediashell` (Chromecast built-in)
- `com.google.android.youtube.tv` (YouTube)
- `vn.vtv.vtvgotv` (VTV Go)
- `com.netflix.ninja` (Netflix)
- `com.wbd.stream` (HBO Max)
- `com.amazon.amazonvideo.livingroom` (Prime Video)
- `com.iqiyi.i18n.tv` (iQIYI)
- `com.mediatek.tv.oneworld.tvcenter` (Live TV & Inputs)
- `com.google.android.inputmethod.latin` (Keyboard)
- `com.smartdevice.duplebluetooth`, `com.smartdevice.bleconnectservice` (Bluetooth remote)

---

### 5.2 Launcher Dock & Configuration (`launcher/app/src/main/res/values/config.xml`)
```xml
<resources>
    <string-array name="dock_apps">
        <item>com.google.android.youtube.tv</item>
        <item>vn.vtv.vtvgotv</item>
        <item>com.netflix.ninja</item>
        <item>com.wbd.stream</item>
    </string-array>
    <string-array name="hidden_apps">
        <item>com.mediatek.tv.oneworld.tvcenter</item>
        <item>com.mediatek.tv.oneworld.wizardkt</item>
    </string-array>
    <string name="live_tv_package" translatable="false">com.mediatek.tv.oneworld.tvcenter</string>
    <integer name="columns">4</integer>
</resources>
```

---

### 5.3 Kids Mode & Sleep Timer Architecture

#### Data Storage (`SharedPreferences: "kids_mode_prefs"`)
- `pin_hash`: SHA-256 hash of 4-digit PIN (default "0000" if uninitialized).
- `is_kids_mode_active`: boolean.
- `timer_duration_minutes`: int (15, 30, 45, 60, or custom).
- `session_start_timestamp`: long.
- `target_sleep_timestamp`: long.
- `is_locked`: boolean (set to true when target timestamp is reached).

#### UI Elements
1. **Top Bar Pill Button (`btnKidsMode`):** Located next to Calendar / Settings pills on the top right. Displays timer status (e.g. "👶 Off" or "👶 28m").
2. **Parental Timer Dialog (`popup_kids_mode.xml`):**
   - Prompt PIN if already set up.
   - Quick duration selectors: `[15 phút]` `[30 phút]` `[45 phút]` `[60 phút]` `[Tắt hẹn giờ]`.
   - Option to Change PIN.
3. **Lock Screen Overlay (`overlay_kids_lock.xml`):**
   - Frosted translucent glass background with soothing bedtime icon & text:
     *"Đã hết giờ xem TV! Bé hãy nghỉ ngơi hoặc nhờ bố mẹ mở khóa."*
   - 4-digit PIN input display (`● ● ● ●`).
   - D-pad accessible numeric pad (0-9, Xóa, Xác nhận) or direct remote numeric keypad capture via `onKeyDown`.
   - Blocks focus from reaching the underlying app grid or dock while active.
   - Disables opening apps until correct PIN is entered.

#### Sleep Trigger & Enforcement Execution
- **Automated Provisioning:** During installation, the deployment script executes:
  ```bash
  adb shell settings put secure enabled_accessibility_services com.gathin.tvhome/.TvAccessibilityService
  adb shell settings put secure accessibility_enabled 1
  ```
- **Active App Interception:**
  1. When remaining seconds <= 0:
     - `TvAccessibilityService` calls `performGlobalAction(GLOBAL_ACTION_HOME)` to pop the foreground app (YouTube/Netflix/HDMI) and return to the launcher.
     - Sets `is_locked = true` in `kids_mode_prefs`.
     - Calls `performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)` to put the TV display to sleep.
  2. When the TV wakes up:
     - The launcher is already in the foreground and immediately renders the full-screen Frosted Glass Lock Screen overlay.
     - `TvAccessibilityService.onKeyEvent()` intercepts all remote shortcut keys (dedicated Netflix, YouTube, media keys) and drops them while `is_locked == true`, directing all focus solely to the PIN keypad.
  3. Legacy Stremio launch logic in `TvAccessibilityService` is removed, restoring standard system passthrough for media buttons during unlocked mode.

#### Session Lifecycle & Persistence Model
- **Timer Execution:** Wall-clock based using `target_sleep_timestamp = System.currentTimeMillis() + duration_ms`. Handled via `AlarmManager` and a lightweight ticker in `TvAccessibilityService` so the countdown survives if `MainActivity` is paused.
- **Reboot Resilience:** A `BroadcastReceiver` listening for `ACTION_BOOT_COMPLETED` checks if `is_locked == true` in SharedPreferences and immediately triggers the lock screen on startup.
- **Unlock Behavior:** Upon entering the correct PIN, `is_locked` is set to `false`, the timer resets to `OFF`, and the TV returns to normal unlocked operation for the parent until the next timer is scheduled.

#### ADB Fallback Rescue
If the user forgets their PIN, running via ADB:
```bash
tools/tv.py 'pm clear com.gathin.tvhome'
```
instantly resets the PIN and preferences without uninstalling.

---

## 6. What's Left to the Builder

- Detailed layout parameters (margins, font sizes, glass styling matching `GlassView.java`).
- Sound/vibration-free UI transitions for the numeric pad.
- Build and installation execution using `./gradlew assembleDebug` and pushing via `tools/tv.py` or `/opt/homebrew/bin/adb install -r`.
- Disabling the default Google TV launcher (`com.google.android.apps.tv.launcherx`) only after successful installation and user confirmation.
