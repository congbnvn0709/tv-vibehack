# Design Spec: TV Launcher UX, Focus Navigation & Localization Fixes

- **Date:** 2026-10-28
- **Status:** Proposed
- **Target Platform:** Android TV 7.0 - 14+ (`minSdk 21`, `targetSdk 29`)

---

## 1. Intent and The Why

The Android TV Launcher (`com.gathin.tvhome`) provides a lightweight, responsive tvOS-like home screen for smart TVs. During user testing on a physical Coocaa TV (Android 14) and TCL TVs, five major user experience and navigation defects were identified:
1. **Language Mismatch:** The settings overlay (`overlay_settings.xml`) contains hardcoded Turkish strings (*Ayarlar & Özelleştirme*, *Duvar Kağıdı Teması*, *Gündüz*, *Gece*...) rather than dynamically adapting to the TV's system language (Vietnamese or English).
2. **Settings D-Pad Skipping:** Moving right across top cards or down jumps to unexpected lower containers because explicit 2D focus traversal attributes are missing or misconfigured.
3. **Calendar Opening Lag:** `renderCalendar()` dynamically inflates 35 individual `item_cal_day.xml` layouts on the main UI thread upon every opening, causing noticeable dropped frames.
4. **Kids Mode & PIN Focus Inconsistencies:**
   - Opening Kids Mode timer focuses on the close button `←` instead of the first timer choice ("15 phút").
   - Transitioning to Change PIN causes a delayed animation callback from the hiding timer overlay to steal focus back to the background launcher dock, forcing the user to traverse through background views before reaching the numpad.
5. **Remote HOME Key Ineffective in Overlays:** When an overlay (Settings, Calendar, Kids Timer) is displayed, pressing the remote's physical `HOME` button fails to dismiss the overlay and return to the main dock.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- Fully localize all launcher text into **English (Default/Fallback)** in `res/values/strings.xml` and **Vietnamese** in `res/values-vi/strings.xml`.
- **Direct Language Switcher on Main Layout:** Add a quick-toggle language pill on the top bar (`btnLanguage`: `🌐 VN` / `🌐 EN`) and a dedicated Language card in Settings (`Auto` / `Tiếng Việt` / `English`), allowing instant switching directly from the TV remote.
- Provide smooth, deterministic 2D D-Pad navigation across all setting cards without jumping down or losing focus.
- Optimize the Calendar view to open instantaneously (< 10ms) without main-thread layout inflation freezes.
- Ensure the Kids Timer automatically focuses on the first option ("15 phút"), and ensure the PIN numpad maintains exclusive, uninterrupted focus.
- Ensure pressing the Remote `HOME` key immediately dismisses any open overlay and restores focus to the main dock.

### Non-Goals
- Adding new setting features or additional launcher customization options not requested.
- Redesigning the visual look and feel of the tvOS UI.

### Anti-Goals
- Breaking TV remote control navigation on older Android TV versions (Android 7 - 9).
- Creating memory leaks by holding static references to Activity contexts in view caches.

---

## 3. Approaches Considered and Selected

### Problem 1: Localization
- **Approach A (Hardcoded Vietnamese):** Change hardcoded Turkish strings to hardcoded Vietnamese.
  - *Trade-off:* Quick, but breaks English/international support.
- **Approach B (Android Resource System `values` and `values-vi`) [SELECTED]:** Extract all strings to standard Android resources with English in `res/values/strings.xml` and Vietnamese in `res/values-vi/strings.xml`.
  - *Trade-off:* Clean, standard Android architecture, automatically adjusts to TV language settings.

### Problem 2: Focus Navigation in Settings
- **Approach A (Rely on Android default FocusFinder):** Rearrange layout hierarchies.
  - *Trade-off:* Fragile across different screen densities and Android versions.
- **Approach B (Explicit 2D D-Pad Focus Matrix) [SELECTED]:** Explicitly bind `nextFocusLeft`, `nextFocusRight`, `nextFocusUp`, `nextFocusDown` IDs on every selectable setting element.
  - *Trade-off:* Deterministic, rock-solid, zero chance of jump-down glitches.

### Problem 3: Calendar Lag Fix
- **Approach A (Asynchronous Background Inflater):** Inflate views off the UI thread.
  - *Trade-off:* Complex state synchronization; still allocates 35 views on every open.
- **Approach B (Single Inflate & Reusable View Cache) [SELECTED]:** Inflate the 5x7 cell grid once (or define it in XML) and simply update text and visibility on subsequent opens (`setText`, `setVisibility`).
  - *Trade-off:* Eliminates view inflation overhead completely. Opening time drops from ~200ms to < 5ms.

### Problem 4: Kids Mode & PIN Numpad Focus
- **Approach A (Delay `requestFocus()` via `postDelayed`):**
  - *Trade-off:* Flaky; depends on device CPU speed and animation timing.
- **Approach B (Focus Clean Handoff & Strict Focus Isolation) [SELECTED]:**
  - In `showKidsSettings()`, immediately invoke `btnTimer15.requestFocus()`.
  - In `startChangePin()`, immediately hide `kidsOverlay` without the delayed `withEndAction` focus thief, show `overlayKidsLock`, and set explicit D-Pad chains on the 3x4 numpad.

### Problem 5: Remote HOME Key
- **Approach A (Catching Key Event in `onKeyDown`):**
  - *Trade-off:* `KEYCODE_HOME` is consumed by Android OS before reaching `onKeyDown` in most Android TV frameworks.
- **Approach B (`onNewIntent` + Local Key Event Handling) [SELECTED]:**
  - Since `MainActivity` has `launchMode="singleTask"`, pressing HOME while the activity is running routes an intent to `onNewIntent(Intent intent)`.
  - Dismiss all visible overlays in `onNewIntent` and reset focus to dock item 0.
  - Also check `dispatchKeyEvent` for `KEYCODE_HOME` as a secondary fallback.

---

## 4. Detailed Technical Architecture

### Part 1: String Resources & Real-time Language Switcher

#### 1. String Resources
Extract all strings from `overlay_settings.xml`, `overlay_calendar.xml`, `overlay_kids_mode.xml`, `overlay_kids_lock.xml`:
- `settings_title`: "Settings & Customization" / "Cài đặt & Tùy biến"
- `settings_subtitle`: "Interface appearance, dock depth, wallpaper, and system preferences" / "Giao diện, độ sâu dock, hình nền và hệ thống"
- `settings_language_title`: "Language" / "Ngôn ngữ"
- `settings_language_desc`: "Switch launcher display language" / "Thay đổi ngôn ngữ hiển thị của giao diện"
- `settings_lang_auto`: "🌐 Auto (System)" / "🌐 Theo TV"
- `settings_lang_vi`: "🇻🇳 Tiếng Việt" / "🇻🇳 Tiếng Việt"
- `settings_lang_en`: "🇬🇧 English" / "🇬🇧 English"
- `settings_top_bar_title`: "Top Bar Style" / "Giao diện thanh trên cùng"
- `settings_top_bar_desc`: "Display style for Calendar, Timer, and Wi-Fi buttons" / "Cách hiển thị Lịch, Hẹn giờ và các nút tiện ích"
- `settings_top_style_text`: "🏷️ Text + Logo" / "🏷️ Chữ + Logo"
- `settings_top_style_icon`: "🔘 Logo Only" / "🔘 Chỉ hiện Logo"
- `settings_wallpaper_title`: "Wallpaper Theme" / "Chủ đề Hình nền"
- `settings_wallpaper_desc`: "Day and night dynamic wallpaper loop" / "Chu kỳ hình nền ngày và đêm sống động"
- `settings_wall_auto`: "🌗 Auto" / "🌗 Tự động"
- `settings_wall_day`: "☀️ Day" / "☀️ Ban ngày"
- `settings_wall_night`: "🌙 Night" / "🌙 Ban đêm"
- `settings_dock_peek_title`: "Dock Peek Depth" / "Độ sâu ẩn Dock"
- `settings_dock_peek_desc`: "Lowering depth when dock is inactive" / "Mức độ hạ xuống khi không chọn Dock"
- `settings_dock_ultra`: "🔻 Ultra Deep (95%)" / "🔻 Siêu sâu (95%)"
- `settings_dock_balanced`: "Half Peek (50%)" / "Vừa phải (50%)"
- `settings_dock_fixed`: "Always Visible" / "Cố định luôn hiện"
- `settings_system_shortcuts_title`: "System Shortcuts" / "Phím tắt Hệ thống TV"
- `settings_system_shortcuts_desc`: "Quick access to device and network settings" / "Truy cập nhanh cài đặt thiết bị và mạng"
- `settings_btn_system`: "⚙️ System Settings" / "⚙️ Cài đặt TV"
- `settings_btn_wifi`: "📶 Wi-Fi Settings" / "📶 Cài đặt Wi-Fi"
- `settings_btn_apps`: "📦 Installed Apps" / "📦 Ứng dụng đã cài"

#### 2. Quick Language Switcher on Main Layout (`activity_main.xml`)
- Add `btnLanguage` pill in `topButtons`:
  - When in English: displays `🌐 EN` (or `🌐 English`).
  - When in Vietnamese: displays `🌐 VN` (or `🌐 Tiếng Việt`).
  - Clicking `btnLanguage` cycles between `Tiếng Việt` and `English` instantly, updates `SharedPreferences` ("app_locale"), and updates the active `Locale` dynamically.
- In Settings overlay: provides the 3-option card: `[Theo TV / Auto]` `[Tiếng Việt]` `[English]`.

### Part 2: Explicit D-Pad Focus Traversal
In `overlay_settings.xml`:
```xml
<!-- Left Column - Top Card -->
<TextView android:id="@+id/btnTopStyleText"
    android:nextFocusRight="@id/btnTopStyleIcon"
    android:nextFocusDown="@id/btnPeekUltra"
    android:nextFocusUp="@id/btnSettingsClose" />

<TextView android:id="@+id/btnTopStyleIcon"
    android:nextFocusLeft="@id/btnTopStyleText"
    android:nextFocusRight="@id/btnWallAuto"
    android:nextFocusDown="@id/btnPeekMid"
    android:nextFocusUp="@id/btnSettingsClose" />

<!-- Right Column - Top Card -->
<TextView android:id="@+id/btnWallAuto"
    android:nextFocusLeft="@id/btnTopStyleIcon"
    android:nextFocusRight="@id/btnWallDay"
    android:nextFocusDown="@id/btnSysSettings"
    android:nextFocusUp="@id/btnSettingsClose" />

<TextView android:id="@+id/btnWallDay"
    android:nextFocusLeft="@id/btnWallAuto"
    android:nextFocusRight="@id/btnWallNight"
    android:nextFocusDown="@id/btnWifiSettings"
    android:nextFocusUp="@id/btnSettingsClose" />

<TextView android:id="@+id/btnWallNight"
    android:nextFocusLeft="@id/btnWallDay"
    android:nextFocusRight="@id/btnWallNight"
    android:nextFocusDown="@id/btnAppsSettings"
    android:nextFocusUp="@id/btnSettingsClose" />
```

### Part 3: Calendar Zero-Lag Grid Reuse
In `MainActivity.java`:
- Cache inflated 35 day views in an array `View[] dayCells = new View[35]` during first initialization.
- In `renderCalendar()`: iterate over the 35 existing cells to update `setText`, `setTextColor`, background dot and focus listeners without calling `calGridTable.removeAllViews()` and without running `LayoutInflater.inflate()` 35 times.

### Part 4: Kids Timer First Focus & Numpad Traversal
- In `showKidsSettings()`:
  Replace `findViewById(R.id.btnKidsClose).requestFocus();` with:
  `findViewById(R.id.btnTimer15).requestFocus();`
- In `startChangePin()`:
  Instantly hide `kidsOverlay` without running the focus-stealing `withEndAction`.
  In `overlay_kids_lock.xml`: define complete 2D nextFocus links for `pad1` through `padEnter`:
  - `pad1`: Right -> `pad2`, Down -> `pad4`, Up -> `pad1`
  - `pad2`: Left -> `pad1`, Right -> `pad3`, Down -> `pad5`, Up -> `pad2`
  - `pad3`: Left -> `pad2`, Right -> `pad3`, Down -> `pad6`, Up -> `pad3`
  - ...
  - `padClear`: Up -> `pad7`, Right -> `pad0`, Down -> `padClear`
  - `pad0`: Up -> `pad8`, Left -> `padClear`, Right -> `padEnter`, Down -> `pad0`
  - `padEnter`: Up -> `pad9`, Left -> `pad0`, Right -> `padEnter`, Down -> `padEnter`

### Part 5: Remote HOME Key Handling
In `MainActivity.java`:
```java
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    dismissAllOverlays();
}

private void dismissAllOverlays() {
    if (settingsOverlay != null && settingsOverlay.getVisibility() == View.VISIBLE) {
        hideSettings();
    }
    if (calendarOverlay != null && calendarOverlay.getVisibility() == View.VISIBLE) {
        hideCalendar();
    }
    if (kidsOverlay != null && kidsOverlay.getVisibility() == View.VISIBLE) {
        hideKidsSettings();
    }
    if (overlayKidsLock != null && overlayKidsLock.getVisibility() == View.VISIBLE) {
        if (!KidsModeManager.isLocked(this)) {
            // Dismiss PIN change dialog if not actually timed-out locked
            overlayKidsLock.setVisibility(View.GONE);
            grid.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
            ((ViewGroup) findViewById(R.id.topButtons)).setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        }
    }
    focusTile(0);
}
```

---

## 5. Verification Plan

1. **Gradle Compilation:** Build Android APK via `./gradlew assembleDebug` in `launcher/`.
2. **Automated Unit Tests:**
   - Add/verify unit tests for focus logic and string resources.
   - Run vitest suite in `desktop/`.
3. **Physical Device Verification on Connected Coocaa TV (`192.168.1.21:5555`):**
   - Install APK via `adb install -r -t -d -g launcher/app/build/outputs/apk/debug/app-debug.apk`.
   - Test TV language switch between Tiếng Việt and English.
   - Test D-Pad navigation across all buttons in Settings.
   - Test Calendar opening speed and smoothness.
   - Test Kids Timer default focus on "15 phút" and PIN numpad navigation.
   - Test Remote HOME key from within all overlays.
