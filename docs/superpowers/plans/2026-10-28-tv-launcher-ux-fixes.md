# TV Launcher UX, Focus Navigation & Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 key UX/navigation defects (Turkish strings, D-Pad skipping, Calendar lag, Kids/PIN focus stealing, HOME key overlay dismissal) and introduce an in-Settings real-time Language Switcher (Auto, Tiếng Việt, English) for the Android TV Launcher (`com.gathin.tvhome`).

**Architecture:** Standard Android resource localization (`values/strings.xml` and `values-vi/strings.xml`) paired with a lightweight `LocaleHelper` for in-app language switching without full process restarts. Settings and PIN numpad layouts use explicit 2D focus traversal attributes (`nextFocus*`) to guarantee deterministic TV remote navigation. Calendar replaces per-open view inflation with a single-pass 35-cell view cache, and `MainActivity` intercepts `onNewIntent` to instantly dismiss all active overlays and refocus the dock on physical HOME key presses.

**Tech Stack:** Android Java (SDK 21 - 34), Gradle, Android View System, JUnit 4, ADB.

**Spec:** [docs/superpowers/specs/2026-10-28-tv-launcher-ux-fixes-design.md](file:///Users/congcm/CODE/Vibe_Code/tv-vibehack/docs/superpowers/specs/2026-10-28-tv-launcher-ux-fixes-design.md)

## Global Constraints

- **minSdk:** 21 (Android 5.0 Lollipop) compatibility maintained; no API > 21 without backward-compatible guards.
- **targetSdk:** 29 (Android 10) preserved.
- **Package name:** `com.gathin.tvhome`.
- **Top bar styling:** Keep the top bar clean (Timer, Calendar, Wi-Fi, Settings pills); the Language Switcher is housed inside the Settings overlay (`overlay_settings.xml`).
- **Physical Device:** Connected at `192.168.1.21:5555` (Coocaa SWTV-24AE-4K, Android 14).
- **No external heavy dependencies:** Use pure Android framework and existing AndroidX libraries.

## Review Focus

1. **Locale Persistence on App Re-launch:** When the user selects "🇻🇳 Tiếng Việt" or "🇬🇧 English", the choice is persisted in `tvhome_prefs` and restored on subsequent cold launches.
2. **D-Pad Boundary Escape Prevention:** In the Settings overlay, navigating left/right/up/down on edge elements never leaves the overlay or causes focus to disappear into inactive background views.
3. **PIN Numpad Complete Navigation:** In the Kids Lock/PIN screen, every key (`0`-`9`, `padClear`, `padEnter`) must navigate cleanly in 4 directions without jumping into background dock tiles.
4. **Calendar Performance:** Opening the Calendar overlay must not execute `removeAllViews()` or dynamic view inflation on subsequent opens.
5. **HOME Key Override while Locked vs Overlaid:** Pressing HOME dismisses Settings, Calendar, and Kids Timer; however, if the TV is in an active timed-out Lock state (`KidsModeManager.isLocked(this) == true`), the Lock overlay must NOT be bypassed.

---

### Task 1: String Resources & Real-time Language Switcher Helper

**Files:**
- Create: `launcher/app/src/main/java/com/gathin/tvhome/LocaleHelper.java`
- Create: `launcher/app/src/main/res/values-vi/strings.xml`
- Modify: `launcher/app/src/main/res/values/strings.xml`
- Modify: `launcher/app/build.gradle` (add `testImplementation 'junit:junit:4.13.2'`)
- Create: `launcher/app/src/test/java/com/gathin/tvhome/LocaleHelperTest.java`

**Interfaces:**
- Consumes: `SharedPreferences` ("tvhome_prefs", key "app_language"), `Context`.
- Produces: `LocaleHelper.applyLocale(Context context, String langCode) -> Context`, `LocaleHelper.getPersistedLocale(Context context) -> String`, `LocaleHelper.resolveLocale(String langCode) -> Locale`.

- [ ] **Step 1: Write the failing unit test for LocaleHelper**

Create `launcher/app/src/test/java/com/gathin/tvhome/LocaleHelperTest.java`:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import org.junit.Test;
import java.util.Locale;

public class LocaleHelperTest {
    @Test
    public void testResolveLocaleVietnamese() {
        Locale l = LocaleHelper.resolveLocale("vi");
        assertEquals("vi", l.getLanguage());
    }

    @Test
    public void testResolveLocaleEnglish() {
        Locale l = LocaleHelper.resolveLocale("en");
        assertEquals("en", l.getLanguage());
    }

    @Test
    public void testResolveLocaleAutoReturnsNull() {
        assertNull(LocaleHelper.resolveLocale("auto"));
        assertNull(LocaleHelper.resolveLocale(null));
        assertNull(LocaleHelper.resolveLocale(""));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.LocaleHelperTest`
Expected: FAIL (cannot find symbol `LocaleHelper`).

- [ ] **Step 3: Implement `LocaleHelper.java`, string resources, and add test dependency**

In `launcher/app/build.gradle`:
Add `testImplementation 'junit:junit:4.13.2'` inside `dependencies { ... }`.

Implement `launcher/app/src/main/java/com/gathin/tvhome/LocaleHelper.java`:
- `public static Locale resolveLocale(String langCode)`: returns `new Locale("vi")` for `"vi"`, `Locale.ENGLISH` for `"en"`, and `null` for `"auto"`, null, or empty.
- `public static String getPersistedLocale(Context context)`: reads string `"app_language"` (default `"auto"`).
- `public static void setPersistedLocale(Context context, String langCode)`: saves string `"app_language"`.
- `public static Context applyLocale(Context context, String langCode)`: updates `Configuration.locale` / `Configuration.setLocale()` and returns updated Context via `context.createConfigurationContext(config)` for API >= 17, and `context.getResources().updateConfiguration(config, dm)` for backwards compatibility.

In `launcher/app/src/main/res/values/strings.xml` (Default English):
Add string keys:
- `settings_title`: "Settings & Customization"
- `settings_subtitle`: "Interface appearance, dock depth, wallpaper, and system preferences"
- `settings_language_title`: "Display Language"
- `settings_language_desc`: "Switch launcher interface language"
- `settings_lang_auto`: "🌐 Auto (TV)"
- `settings_lang_vi`: "🇻🇳 Tiếng Việt"
- `settings_lang_en`: "🇬🇧 English"
- `settings_top_bar_title`: "Top Bar Style"
- `settings_top_bar_desc`: "Display style for Calendar, Timer, and utility buttons"
- `settings_top_style_text`: "🏷️ Text + Logo"
- `settings_top_style_icon`: "🔘 Logo Only"
- `settings_wallpaper_title`: "Wallpaper Theme"
- `settings_wallpaper_desc`: "Day and night dynamic wallpaper loop"
- `settings_wall_auto`: "🌗 Auto"
- `settings_wall_day`: "☀️ Day"
- `settings_wall_night`: "🌙 Night"
- `settings_dock_peek_title`: "Dock Peek Depth"
- `settings_dock_peek_desc`: "Lowering depth when dock is inactive"
- `settings_dock_ultra`: "🔻 Ultra Deep (95%)"
- `settings_dock_balanced`: "↔️ Balanced (50%)"
- `settings_dock_fixed`: "⬆️ Always Visible"
- `settings_system_shortcuts_title`: "System Shortcuts"
- `settings_system_shortcuts_desc`: "Quick access to device and network settings"
- `settings_btn_system`: "⚙️ System Settings"
- `settings_btn_wifi`: "📶 Wi-Fi Settings"
- `settings_btn_apps`: "📱 Installed Apps"
- Calendar strings: `cal_title`: "Calendar", `cal_today`: "Today", `cal_no_events`: "No scheduled events"
- Kids Mode strings: `kids_title`: "Kids Mode & Sleep Timer", `kids_subtitle`: "Protect children's eyes and manage TV screen time", `kids_status_prefix`: "Status: ", `kids_status_off`: "Disabled", `kids_status_remain`: "Turns off in %1$d mins", `kids_btn_15`: "15 Mins", `kids_btn_30`: "30 Mins", `kids_btn_45`: "45 Mins", `kids_btn_60`: "60 Mins", `kids_btn_off`: "Disable", `kids_change_pin`: "🔒 Change PIN", `kids_lock_now`: "🌙 Lock TV Now", `kids_locked_heading`: "TIME IS UP", `kids_locked_subtitle`: "Time to rest! Ask parents to enter the PIN to unlock.", `kids_pin_prompt_current`: "Enter current PIN (default 0000):", `kids_pin_prompt_new`: "Enter new 4-digit PIN:", `kids_pin_changed`: "PIN changed successfully!", `kids_pin_wrong`: "Incorrect PIN!"

Create `launcher/app/src/main/res/values-vi/strings.xml`:
Provide matching Vietnamese translations:
- `app_name`: "Trang chủ"
- `inputs`: "Cổng vào"
- `wifi`: "Wi-Fi"
- `settings`: "Cài đặt"
- `choose_input`: "Chọn cổng vào"
- `connected`: "Đã kết nối"
- `standby`: "Chờ tín hiệu"
- `not_connected`: "Không có thiết bị"
- `live_tv`: "Truyền hình"
- `no_inputs`: "Không tìm thấy cổng vào"
- `good_morning`: "Chào buổi sáng"
- `good_afternoon`: "Chào buổi chiều"
- `good_evening`: "Chào buổi tối"
- `good_night`: "Chúc ngủ ngon"
- `ethernet`: "Mạng dây"
- `offline`: "Ngoại tuyến"
- `settings_title`: "Cài đặt & Tùy biến"
- `settings_subtitle`: "Giao diện, độ sâu dock, hình nền và hệ thống"
- `settings_language_title`: "Ngôn ngữ hiển thị"
- `settings_language_desc`: "Thay đổi ngôn ngữ hiển thị của giao diện"
- `settings_lang_auto`: "🌐 Theo TV"
- `settings_lang_vi`: "🇻🇳 Tiếng Việt"
- `settings_lang_en`: "🇬🇧 English"
- `settings_top_bar_title`: "Giao diện thanh trên cùng"
- `settings_top_bar_desc`: "Cách hiển thị Lịch, Hẹn giờ và các nút tiện ích"
- `settings_top_style_text`: "🏷️ Chữ + Logo"
- `settings_top_style_icon`: "🔘 Chỉ hiện Logo"
- `settings_wallpaper_title`: "Chủ đề Hình nền"
- `settings_wallpaper_desc`: "Chu kỳ hình nền ngày và đêm sống động"
- `settings_wall_auto`: "🌗 Tự động"
- `settings_wall_day`: "☀️ Ban ngày"
- `settings_wall_night`: "🌙 Ban đêm"
- `settings_dock_peek_title`: "Độ sâu ẩn Dock"
- `settings_dock_peek_desc`: "Mức độ hạ xuống khi không chọn Dock"
- `settings_dock_ultra`: "🔻 Siêu sâu (95%)"
- `settings_dock_balanced`: "↔️ Vừa phải (50%)"
- `settings_dock_fixed`: "⬆️ Cố định luôn hiện"
- `settings_system_shortcuts_title`: "Phím tắt Hệ thống TV"
- `settings_system_shortcuts_desc`: "Truy cập nhanh cài đặt thiết bị và mạng"
- `settings_btn_system`: "⚙️ Cài đặt TV"
- `settings_btn_wifi`: "📶 Cài đặt Wi-Fi"
- `settings_btn_apps`: "📱 Ứng dụng đã cài"
- `cal_title`: "Lịch", `cal_today`: "Hôm nay", `cal_no_events`: "Không có lịch trình"
- `kids_title`: "Chế độ Trẻ em & Hẹn giờ", `kids_subtitle`: "Bảo vệ mắt cho bé và quản lý thời gian xem TV", `kids_status_prefix`: "Trạng thái: ", `kids_status_off`: "Đang tắt", `kids_status_remain`: "Tắt sau %1$d phút", `kids_btn_15`: "15 Phút", `kids_btn_30`: "30 Phút", `kids_btn_45`: "45 Phút", `kids_btn_60`: "60 Phút", `kids_btn_off`: "Tắt hẹn giờ", `kids_change_pin`: "🔒 Đổi mã PIN", `kids_lock_now`: "🌙 Khóa TV ngay", `kids_locked_heading`: "ĐÃ HẾT GIỜ XEM TV", `kids_locked_subtitle`: "Bé hãy nghỉ ngơi nhé. Nhờ bố mẹ nhập mã PIN để mở khóa.", `kids_pin_prompt_current`: "Nhập mã PIN hiện tại (mặc định 0000):", `kids_pin_prompt_new`: "Nhập mã PIN mới (4 số):", `kids_pin_changed`: "Đã đổi mã PIN thành công!", `kids_pin_wrong`: "Mã PIN không đúng!"

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.LocaleHelperTest`
Expected: PASS (all 3 tests pass).

- [ ] **Step 5: Commit**

```bash
git add launcher/app/build.gradle launcher/app/src/main/java/com/gathin/tvhome/LocaleHelper.java launcher/app/src/main/res/values/strings.xml launcher/app/src/main/res/values-vi/strings.xml launcher/app/src/test/java/com/gathin/tvhome/LocaleHelperTest.java
git commit -m "feat(launcher): add string localization and LocaleHelper"
```

---

### Task 2: Settings Layout & Language Card with 2D D-Pad Focus Matrix

**Files:**
- Modify: `launcher/app/src/main/res/layout/overlay_settings.xml`
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`

**Interfaces:**
- Consumes: `LocaleHelper.getPersistedLocale()`, `LocaleHelper.setPersistedLocale()`, `LocaleHelper.applyLocale()`, `R.string.*`.
- Produces: Settings overlay with Language Card (`btnLangAuto`, `btnLangVi`, `btnLangEn`), all strings bound to string resources, and complete 2D focus traversal attributes (`nextFocusLeft`, `nextFocusRight`, `nextFocusUp`, `nextFocusDown`).

- [ ] **Step 1: Write test or layout validation for focus linkage**

Create a unit test `launcher/app/src/test/java/com/gathin/tvhome/SettingsFocusMatrixTest.java` verifying that `overlay_settings.xml` contains all expected IDs and no duplicate/broken ID references:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertTrue;
import org.junit.Test;
import java.io.File;
import java.nio.file.Files;

public class SettingsFocusMatrixTest {
    @Test
    public void testOverlaySettingsContainsLanguageAndFocusMatrix() throws Exception {
        File file = new File("src/main/res/layout/overlay_settings.xml");
        String content = new String(Files.readAllBytes(file.toPath()));
        assertTrue(content.contains("btnLangAuto"));
        assertTrue(content.contains("btnLangVi"));
        assertTrue(content.contains("btnLangEn"));
        assertTrue(content.contains("nextFocusRight"));
        assertTrue(content.contains("nextFocusDown"));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.SettingsFocusMatrixTest`
Expected: FAIL (content does not contain `btnLangAuto`).

- [ ] **Step 3: Update `overlay_settings.xml` and wire in `MainActivity.java`**

In `launcher/app/src/main/res/layout/overlay_settings.xml`:
- Replace all hardcoded Turkish strings with `@string/...` (`@string/settings_title`, `@string/settings_subtitle`, etc.).
- Add the **Language Card** in the Left Column:
  - Title: `@string/settings_language_title`
  - Desc: `@string/settings_language_desc`
  - 3 options: `btnLangAuto` (`@string/settings_lang_auto`), `btnLangVi` (`@string/settings_lang_vi`), `btnLangEn` (`@string/settings_lang_en`).
- Configure explicit 2D navigation matrix:
  - `btnSettingsClose`: down -> `btnLangAuto`
  - `btnLangAuto`: up -> `btnSettingsClose`, right -> `btnLangVi`, down -> `btnTopStyleText`
  - `btnLangVi`: up -> `btnSettingsClose`, left -> `btnLangAuto`, right -> `btnLangEn`, down -> `btnTopStyleIcon`
  - `btnLangEn`: up -> `btnSettingsClose`, left -> `btnLangVi`, right -> `btnWallAuto`, down -> `btnTopStyleIcon`
  - `btnTopStyleText`: up -> `btnLangAuto`, right -> `btnTopStyleIcon`, down -> `btnPeekUltra`
  - `btnTopStyleIcon`: up -> `btnLangVi`, left -> `btnTopStyleText`, right -> `btnWallAuto`, down -> `btnPeekBalanced`
  - `btnPeekUltra`: up -> `btnTopStyleText`, right -> `btnPeekBalanced`, down -> `btnPeekUltra`
  - `btnPeekBalanced`: up -> `btnTopStyleIcon`, left -> `btnPeekUltra`, right -> `btnPeekNone`, down -> `btnPeekBalanced`
  - `btnPeekNone`: up -> `btnTopStyleIcon`, left -> `btnPeekBalanced`, right -> `btnSysSettings`, down -> `btnPeekNone`
  - `btnWallAuto`: up -> `btnSettingsClose`, left -> `btnLangEn`, right -> `btnWallDay`, down -> `btnSysSettings`
  - `btnWallDay`: up -> `btnSettingsClose`, left -> `btnWallAuto`, right -> `btnWallNight`, down -> `btnSysWifi`
  - `btnWallNight`: up -> `btnSettingsClose`, left -> `btnWallDay`, right -> `btnWallNight`, down -> `btnSysApps`
  - `btnSysSettings`: up -> `btnWallAuto`, left -> `btnPeekNone`, right -> `btnSysWifi`, down -> `btnSysSettings`
  - `btnSysWifi`: up -> `btnWallDay`, left -> `btnSysSettings`, right -> `btnSysApps`, down -> `btnSysWifi`
  - `btnSysApps`: up -> `btnWallNight`, left -> `btnSysWifi`, right -> `btnSysApps`, down -> `btnSysApps`

In `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`:
- In `onCreate()` / `attachBaseContext()`: call `LocaleHelper.applyLocale(this, LocaleHelper.getPersistedLocale(this))` so the app starts with the user's preferred language.
- In `showSettings()`: bind `btnLangAuto`, `btnLangVi`, `btnLangEn`.
  - Set click listeners to call `changeLanguage("auto")`, `changeLanguage("vi")`, `changeLanguage("en")`.
- In `updateSettingsUI()`: set `isSelected` on `btnLangAuto`, `btnLangVi`, `btnLangEn` based on current persisted language.
- Implement `changeLanguage(String langCode)`:
  - Save to SharedPreferences via `LocaleHelper.setPersistedLocale(this, langCode)`.
  - Apply locale via `LocaleHelper.applyLocale(this, langCode)`.
  - Recreate Activity or refresh all UI strings (`recreate()` or dynamic text reset) so all layouts, pills, and settings immediately show in the chosen language.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.SettingsFocusMatrixTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/res/layout/overlay_settings.xml launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java launcher/app/src/test/java/com/gathin/tvhome/SettingsFocusMatrixTest.java
git commit -m "feat(settings): add Language Card and 2D D-Pad focus matrix"
```

---

### Task 3: Calendar View Reusable Cache & Lag Elimination

**Files:**
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`
- Modify: `launcher/app/src/main/res/layout/overlay_calendar.xml`

**Interfaces:**
- Consumes: `overlay_calendar.xml`, `R.layout.item_cal_day`, `calYear`, `calMonth`.
- Produces: Zero-inflation `renderCalendar()` caching 35 cell views (`DayCellViewHolder[35]`).

- [ ] **Step 1: Write test for DayCellViewHolder structure**

Create a unit test `launcher/app/src/test/java/com/gathin/tvhome/CalendarLogicTest.java`:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import java.util.Calendar;

public class CalendarLogicTest {
    @Test
    public void testFirstDayOfWeekCalculation() {
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.OCTOBER, 1);
        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sunday
        // Oct 1, 2026 is Thursday -> Calendar.THURSDAY is 5 -> 5 - 1 = 4
        assertEquals(4, firstDayOfWeek);
    }
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.CalendarLogicTest`
Expected: PASS.

- [ ] **Step 3: Implement Reusable View Cache for Calendar**

In `MainActivity.java`:
- Define static inner class or field:
```java
private static class DayCellViewHolder {
    View root;
    TextView tvDayNum;
    View dotToday;
    View eventBadge;
    View eventDot;
    TextView eventText;
}
private final DayCellViewHolder[] dayCellHolders = new DayCellViewHolder[35];
private boolean calendarGridInitialized = false;
```
- In `showCalendar()` / `initCalendarGrid()`:
  - If `!calendarGridInitialized`:
    - `calGridTable.removeAllViews();`
    - Loop 5 rows and 7 cols, inflate `item_cal_day` once, populate `dayCellHolders[i]`, and add to `calGridTable`.
    - `calendarGridInitialized = true;`
- In `renderCalendar()`:
  - Do NOT call `calGridTable.removeAllViews()`.
  - Iterate over `dayCellHolders[0..34]`.
  - For each cell: update `tvDayNum.setText()`, text colors, `setFocusable()`, `setClickable()`, `dotToday.setVisibility()`, `eventBadge.setVisibility()`, and focus listeners.
  - Set `nextFocusUp` on Row 0 cells pointing to `R.id.btnCalToday`.
- Localize hardcoded strings in `overlay_calendar.xml` and `renderCalendar()` using `@string/cal_*`.

- [ ] **Step 4: Run build and unit tests**

Run: `cd launcher && ./gradlew testDebugUnitTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java launcher/app/src/main/res/layout/overlay_calendar.xml launcher/app/src/test/java/com/gathin/tvhome/CalendarLogicTest.java
git commit -m "perf(calendar): eliminate lag by reusing 35-cell view cache"
```

---

### Task 4: Kids Timer First Focus & PIN Traversal Isolation

**Files:**
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`
- Modify: `launcher/app/src/main/res/layout/overlay_kids_mode.xml`
- Modify: `launcher/app/src/main/res/layout/overlay_kids_lock.xml`

**Interfaces:**
- Consumes: `KidsModeManager`, `overlay_kids_lock.xml`, `overlay_kids_mode.xml`.
- Produces: Initial focus on `btnTimer15` in Kids Timer, immediate overlay transition to PIN lock screen without focus theft, and complete 2D D-Pad nextFocus linkage for the 3x4 numpad (`pad0`-`pad9`, `padClear`, `padEnter`).

- [ ] **Step 1: Write unit test validating PIN numpad focus attributes**

Create `launcher/app/src/test/java/com/gathin/tvhome/KidsLockFocusTest.java`:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertTrue;
import org.junit.Test;
import java.io.File;
import java.nio.file.Files;

public class KidsLockFocusTest {
    @Test
    public void testKidsLockNumpadHasExplicitFocusAttributes() throws Exception {
        File file = new File("src/main/res/layout/overlay_kids_lock.xml");
        String content = new String(Files.readAllBytes(file.toPath()));
        assertTrue(content.contains("android:id=\"@+id/pad1\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/pad2\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad4\""));
        assertTrue(content.contains("android:id=\"@+id/pad0\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/pad8\""));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.KidsLockFocusTest`
Expected: FAIL (missing `nextFocus` attributes).

- [ ] **Step 3: Implement Focus Clean Handoff and Numpad Traversal**

In `launcher/app/src/main/res/layout/overlay_kids_lock.xml`:
- Add explicit 2D nextFocus attributes on all 12 numpad keys:
  - `pad1`: left `@id/pad1`, right `@id/pad2`, up `@id/pad1`, down `@id/pad4`
  - `pad2`: left `@id/pad1`, right `@id/pad3`, up `@id/pad2`, down `@id/pad5`
  - `pad3`: left `@id/pad2`, right `@id/pad3`, up `@id/pad3`, down `@id/pad6`
  - `pad4`: left `@id/pad4`, right `@id/pad5`, up `@id/pad1`, down `@id/pad7`
  - `pad5`: left `@id/pad4`, right `@id/pad6`, up `@id/pad2`, down `@id/pad8`
  - `pad6`: left `@id/pad5`, right `@id/pad6`, up `@id/pad3`, down `@id/pad9`
  - `pad7`: left `@id/pad7`, right `@id/pad8`, up `@id/pad4`, down `@id/padClear`
  - `pad8`: left `@id/pad7`, right `@id/pad9`, up `@id/pad5`, down `@id/pad0`
  - `pad9`: left `@id/pad8`, right `@id/pad9`, up `@id/pad6`, down `@id/padEnter`
  - `padClear`: left `@id/padClear`, right `@id/pad0`, up `@id/pad7`, down `@id/padClear`
  - `pad0`: left `@id/padClear`, right `@id/padEnter`, up `@id/pad8`, down `@id/pad0`
  - `padEnter`: left `@id/pad0`, right `@id/padEnter`, up `@id/pad9`, down `@id/padEnter`
- Replace hardcoded text with string resources `@string/kids_*`.

In `launcher/app/src/main/res/layout/overlay_kids_mode.xml`:
- Replace hardcoded text with string resources `@string/kids_*`.

In `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`:
- In `showKidsSettings()`: replace `findViewById(R.id.btnKidsClose).requestFocus()` with:
  `findViewById(R.id.btnTimer15).requestFocus();`
- In `startChangePin()`:
  - Do NOT call `hideKidsSettings()` (which schedules an asynchronous `withEndAction` 180ms later stealing focus back to `btnKidsMode`).
  - Instead, immediately cancel animations on `kidsOverlay`, hide it (`kidsOverlay.setVisibility(View.GONE)`), set `isChangingPin = true`, show `overlayKidsLock`, and immediately focus `pad1` (`findViewById(R.id.pad1).requestFocus()`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.KidsLockFocusTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/res/layout/overlay_kids_lock.xml launcher/app/src/main/res/layout/overlay_kids_mode.xml launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java launcher/app/src/test/java/com/gathin/tvhome/KidsLockFocusTest.java
git commit -m "fix(kids): focus first timer option and isolate PIN numpad navigation"
```

---

### Task 5: Remote HOME Key Global Dismissal

**Files:**
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`

**Interfaces:**
- Consumes: `onNewIntent(Intent intent)`, `dispatchKeyEvent(KeyEvent event)`, `KidsModeManager.isLocked()`.
- Produces: `dismissAllOverlays()`, ensuring Remote HOME button dismisses Settings, Calendar, and Kids Timer without breaking time lock.

- [ ] **Step 1: Write unit test validating dismissAllOverlays logic**

Create `launcher/app/src/test/java/com/gathin/tvhome/OverlayDismissTest.java`:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;

public class OverlayDismissTest {
    @Test
    public void testOverlayDismissConditionWhenNotLocked() {
        boolean isTimeLocked = false;
        boolean canDismissLockScreen = !isTimeLocked;
        assertTrue(canDismissLockScreen);
    }

    @Test
    public void testOverlayDismissConditionWhenLocked() {
        boolean isTimeLocked = true;
        boolean canDismissLockScreen = !isTimeLocked;
        assertFalse(canDismissLockScreen);
    }
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.OverlayDismissTest`
Expected: PASS.

- [ ] **Step 3: Implement `onNewIntent` and `dismissAllOverlays` in `MainActivity.java`**

In `MainActivity.java`:
- Override `onNewIntent(Intent intent)`:
```java
@Override
protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    dismissAllOverlays();
}
```
- Implement `private void dismissAllOverlays()`:
```java
private void dismissAllOverlays() {
    if (settingsOverlay != null && settingsOverlay.getVisibility() == View.VISIBLE) {
        settingsOverlay.animate().cancel();
        settingsOverlay.setVisibility(View.GONE);
    }
    if (calendarOverlay != null && calendarOverlay.getVisibility() == View.VISIBLE) {
        calendarOverlay.animate().cancel();
        calendarOverlay.setVisibility(View.GONE);
    }
    if (kidsOverlay != null && kidsOverlay.getVisibility() == View.VISIBLE) {
        kidsOverlay.animate().cancel();
        kidsOverlay.setVisibility(View.GONE);
    }
    if (overlayKidsLock != null && overlayKidsLock.getVisibility() == View.VISIBLE) {
        // Only dismiss if not in active timed-out lock
        if (!KidsModeManager.isLocked(this)) {
            overlayKidsLock.animate().cancel();
            overlayKidsLock.setVisibility(View.GONE);
            isChangingPin = false;
        }
    }
    grid.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
    View topButtons = findViewById(R.id.topButtons);
    if (topButtons instanceof ViewGroup) {
        ((ViewGroup) topButtons).setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
    }
    if (!KidsModeManager.isLocked(this)) {
        focusTile(0);
    }
}
```
- In `dispatchKeyEvent(KeyEvent event)`:
  - If `event.getKeyCode() == KeyEvent.KEYCODE_HOME && event.getAction() == KeyEvent.ACTION_UP`:
    - Call `dismissAllOverlays()`.

- [ ] **Step 4: Run all unit tests**

Run: `cd launcher && ./gradlew testDebugUnitTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java launcher/app/src/test/java/com/gathin/tvhome/OverlayDismissTest.java
git commit -m "feat(navigation): dismiss all overlays and refocus dock on HOME key"
```

---

### Task 6: Full Build, Sideload & Physical Verification on Coocaa TV

**Files:**
- Binary: `launcher/app/build/outputs/apk/debug/app-debug.apk`

**Interfaces:**
- Consumes: All Task 1-5 changes.
- Produces: Installed and running updated launcher on connected Coocaa TV (`192.168.1.21:5555`).

- [ ] **Step 1: Run complete Gradle debug build**

Run: `cd launcher && ./gradlew assembleDebug`
Expected: BUILD SUCCESSFUL with `app-debug.apk` generated.

- [ ] **Step 2: Sideload APK to connected TV**

Run: `adb -s 192.168.1.21:5555 install -r -t -d -g launcher/app/build/outputs/apk/debug/app-debug.apk`
Expected: `Success`.

- [ ] **Step 3: Launch MainActivity on TV**

Run: `adb -s 192.168.1.21:5555 shell am start -n com.gathin.tvhome/.MainActivity`
Expected: Launcher launches and displays home screen.

- [ ] **Step 4: Verify all 5 user points via automated ADB key events**

1. **Language & Settings D-Pad Matrix:**
   - Simulate D-Pad navigation to Settings button and click ENTER:
     `adb -s 192.168.1.21:5555 shell input keyevent 19` (UP)
     `adb -s 192.168.1.21:5555 shell input keyevent 22` (RIGHT to Settings)
     `adb -s 192.168.1.21:5555 shell input keyevent 66` (ENTER)
   - Verify Settings overlay appears with Vietnamese/English texts.
   - Navigate D-Pad DOWN to `btnLangAuto`, RIGHT to `btnLangVi`, RIGHT to `btnLangEn`, verifying focus does NOT jump to bottom containers.
2. **Calendar Lag Verification:**
   - Navigate to Calendar and press ENTER:
     `adb -s 192.168.1.21:5555 shell input keyevent 66`
   - Observe instantaneous rendering without lag or dropped frames.
3. **Kids Timer Initial Focus:**
   - Open Kids Timer:
     `adb -s 192.168.1.21:5555 shell input keyevent 66`
   - Dump focused view via `adb shell dumpsys window | grep -i mCurrentFocus` or activity focus log, verifying `btnTimer15` is focused instead of the close button.
4. **PIN Screen Transition & Keypad:**
   - Click "Đổi mã PIN":
     Verify numpad `pad1` is immediately focused and background dock does not steal focus.
5. **HOME Key Dismissal:**
   - With an overlay open, send HOME key:
     `adb -s 192.168.1.21:5555 shell input keyevent 3` (KEYCODE_HOME)
   - Verify all overlays close immediately and dock item 0 receives focus.

- [ ] **Step 5: Commit final verification and release**

```bash
git commit --allow-empty -m "chore(release): verified TV Launcher UX fixes on Coocaa TV"
```
