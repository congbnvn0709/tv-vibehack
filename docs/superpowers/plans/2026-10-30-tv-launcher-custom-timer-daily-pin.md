# TV Launcher Custom Sleep Timer & Dynamic Daily PIN (DDMM) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement dynamic daily default PIN in 4-digit `DDMM` format (e.g. 30/10 -> `3010`) while preserving custom PIN support, and add a custom sleep timer duration option (`btnTimerCustom`) that reuses the 3x4 on-screen keypad to input minutes (1 - 720 mins).

**Architecture:** Extend `KidsModeManager` to generate daily default PIN via `ddMM` date formatting when no custom PIN hash is stored in SharedPreferences. Add `btnTimerCustom` to `overlay_kids_mode.xml`. Extend `showLockScreen()` in `MainActivity.java` with a custom timer entry mode that displays the entered numeric minutes instead of masked PIN dots and sets the custom timer upon pressing `OK`.

**Tech Stack:** Android Java (SDK 21 - 34), Gradle, Android View System, JUnit 4, ADB.

**Spec:** [docs/superpowers/specs/2026-10-30-tv-launcher-custom-timer-daily-pin-design.md](file:///Users/congcm/CODE/Vibe_Code/tv-vibehack/docs/superpowers/specs/2026-10-30-tv-launcher-custom-timer-daily-pin-design.md)

## Global Constraints

- **minSdk:** 21 (Android 5.0 Lollipop) compatibility maintained.
- **targetSdk:** 29, **compileSdk:** 34.
- **PIN format:** Strictly 4 digits (`ddMM`, e.g., October 30 -> `3010`).
- **Input Method:** Reuses existing 3x4 D-Pad keypad; zero dependencies on virtual keyboard / Leanback IME.
- **Localization:** Both English (`res/values/strings.xml`) and Vietnamese (`res/values-vi/strings.xml`).

## Review Focus

1. **Date Rollover:** At midnight when the date changes, the default PIN immediately switches to the new date's `ddMM` without requiring app cache clearing.
2. **Custom PIN Precedence:** If a parent has set a custom PIN, `verifyPin()` strictly checks against the custom PIN hash and ignores the daily default.
3. **Timer Input Validation:** Custom timer input handles bounds (1 to 720 minutes), ignores leading zeros when appropriate, and handles backspace gracefully.
4. **Keypad Focus & Traversal:** Entering custom timer mode must not break 2D D-Pad nextFocus links on `pad0`–`pad9`, `padClear`, and `padEnter`.
5. **Overlay Transitions:** Exiting or canceling custom timer input cleanly returns to Kids Mode settings overlay or home dock without focus traps.

---

### Task 1: Dynamic Daily PIN (DDMM) in KidsModeManager & Unit Tests

**Files:**
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/KidsModeManager.java`
- Modify: `launcher/app/src/main/res/values/strings.xml`
- Modify: `launcher/app/src/main/res/values-vi/strings.xml`
- Create: `launcher/app/src/test/java/com/gathin/tvhome/KidsModeManagerTest.java`

**Interfaces:**
- Consumes: `Date`, `SimpleDateFormat`, `SharedPreferences`.
- Produces: `KidsModeManager.getDailyDefaultPin() -> String`, `KidsModeManager.getDailyDefaultPin(Date date) -> String`, updated `KidsModeManager.verifyPin(Context, String)`.

- [ ] **Step 1: Write the failing unit test for dynamic daily PIN**

Create `launcher/app/src/test/java/com/gathin/tvhome/KidsModeManagerTest.java`:
```java
package com.gathin.tvhome;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import org.junit.Test;
import java.util.Calendar;
import java.util.Date;

public class KidsModeManagerTest {
    @Test
    public void testDailyDefaultPinFormat() {
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.OCTOBER, 30, 10, 0, 0); // 30 Oct 2026
        String pin = KidsModeManager.getDailyDefaultPin(cal.getTime());
        assertEquals("3010", pin);

        cal.set(2026, Calendar.JANUARY, 5, 8, 0, 0); // 05 Jan 2026
        String pinJan = KidsModeManager.getDailyDefaultPin(cal.getTime());
        assertEquals("0501", pinJan);
    }

    @Test
    public void testGetDailyDefaultPinNonNull() {
        String pin = KidsModeManager.getDailyDefaultPin();
        assertNotNull(pin);
        assertEquals(4, pin.length());
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.KidsModeManagerTest`
Expected: FAIL (cannot find symbol `getDailyDefaultPin`).

- [ ] **Step 3: Implement dynamic daily PIN in `KidsModeManager.java` and update strings**

In `launcher/app/src/main/java/com/gathin/tvhome/KidsModeManager.java`:
- Add:
```java
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public static String getDailyDefaultPin(Date date) {
    return new SimpleDateFormat("ddMM", Locale.getDefault()).format(date);
}

public static String getDailyDefaultPin() {
    return getDailyDefaultPin(new Date());
}
```
- Update `verifyPin(Context context, String pin)`:
```java
public static boolean verifyPin(Context context, String pin) {
    if (pin == null || pin.length() != 4) return false;
    SharedPreferences prefs = getPrefs(context);
    String savedHash = prefs.getString(KEY_PIN_HASH, null);
    if (savedHash == null) {
        return getDailyDefaultPin().equals(pin);
    }
    return hashPin(pin).equals(savedHash);
}
```

In `launcher/app/src/main/res/values/strings.xml`:
- Add `kids_pin_default_hint`: `"Default PIN is today's date (DDMM, e.g. 3010)."`
- Add `kids_btn_custom`: `"⏱️ Custom..."`
- Add `kids_prompt_custom_timer`: `"Enter timer minutes (1 - 720):"`
- Update `kids_pin_prompt_current`: `"Enter current PIN (default DDMM):"`

In `launcher/app/src/main/res/values-vi/strings.xml`:
- Add `kids_pin_default_hint`: `"Mã PIN mặc định là ngày/tháng hôm nay (DDMM, ví dụ: 3010)."`
- Add `kids_btn_custom`: `"⏱️ Tùy chỉnh..."`
- Add `kids_prompt_custom_timer`: `"Nhập số phút hẹn giờ (1 - 720):"`
- Update `kids_pin_prompt_current`: `"Nhập mã PIN hiện tại (mặc định DDMM):"`

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.KidsModeManagerTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/java/com/gathin/tvhome/KidsModeManager.java launcher/app/src/main/res/values/strings.xml launcher/app/src/main/res/values-vi/strings.xml launcher/app/src/test/java/com/gathin/tvhome/KidsModeManagerTest.java
git commit -m "feat(kids): add dynamic daily default PIN in DDMM format"
```

---

### Task 2: Custom Timer Button & Keypad Duration Input in `overlay_kids_mode.xml` & `MainActivity.java`

**Files:**
- Modify: `launcher/app/src/main/res/layout/overlay_kids_mode.xml`
- Modify: `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`
- Modify: `launcher/app/src/test/java/com/gathin/tvhome/KidsLockFocusTest.java`

**Interfaces:**
- Consumes: `overlay_kids_mode.xml`, `overlay_kids_lock.xml`, `KidsModeManager.startTimer()`.
- Produces: `btnTimerCustom` in Kids Mode overlay, `showCustomTimerInput()` in `MainActivity.java`, keypad digit handling for minutes entry.

- [ ] **Step 1: Write test validating `btnTimerCustom` exists in layout**

Update `launcher/app/src/test/java/com/gathin/tvhome/KidsLockFocusTest.java`:
Add test `testKidsModeOverlayContainsCustomTimerButton()`:
```java
@Test
public void testKidsModeOverlayContainsCustomTimerButton() throws Exception {
    File file = new File("src/main/res/layout/overlay_kids_mode.xml");
    String content = new String(Files.readAllBytes(file.toPath()));
    assertTrue(content.contains("android:id=\"@+id/btnTimerCustom\""));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd launcher && ./gradlew testDebugUnitTest --tests com.gathin.tvhome.KidsLockFocusTest`
Expected: FAIL (missing `btnTimerCustom`).

- [ ] **Step 3: Implement `btnTimerCustom` and Custom Timer Keypad Input**

In `launcher/app/src/main/res/layout/overlay_kids_mode.xml`:
- Insert `btnTimerCustom` between `btnTimer60` and `btnTimerOff`:
```xml
<TextView
    android:id="@+id/btnTimerCustom"
    style="@style/SettingOption"
    android:layout_marginStart="14dp"
    android:text="@string/kids_btn_custom" />
```
- Update subtitle in security section to use `@string/kids_pin_default_hint`.

In `launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java`:
- Add field:
```java
private boolean isCustomTimerInput = false;
private final StringBuilder customTimerInput = new StringBuilder();
```
- In `showKidsSettings()`:
  - Wire `findViewById(R.id.btnTimerCustom).setOnClickListener(v -> startCustomTimerInput());`
- In `updateKidsOverlayUI()`:
  - Highlight `btnTimerCustom` if active timer minutes does not match 15, 30, 45, 60 or 0:
    ```java
    int cur = KidsModeManager.getTimerMinutes(this);
    findViewById(R.id.btnTimerCustom).setSelected(cur > 0 && cur != 15 && cur != 30 && cur != 45 && cur != 60);
    ```
- Implement `startCustomTimerInput()`:
  ```java
  private void startCustomTimerInput() {
      if (kidsOverlay != null) {
          kidsOverlay.animate().cancel();
          kidsOverlay.setVisibility(View.GONE);
      }
      isCustomTimerInput = true;
      customTimerInput.setLength(0);
      showLockScreen();
      TextView heading = findViewById(R.id.txtLockHeading);
      if (heading != null) heading.setText(R.string.kids_title);
      TextView sub = findViewById(R.id.txtLockSubtitle);
      if (sub != null) sub.setText(R.string.kids_prompt_custom_timer);
      updateCustomTimerDisplay();
  }
  ```
- In `onPinDigitEntered(int digit)`:
  - If `isCustomTimerInput`:
    - If `customTimerInput.length() < 3`:
      - If `customTimerInput.length() == 0 && digit == 0` -> ignore.
      - Else append digit and update display.
    - return.
- In `onPinBackspace()`:
  - If `isCustomTimerInput`:
    - If `customTimerInput.length() > 0`:
      - delete last char and update display.
    - return.
- Implement `updateCustomTimerDisplay()`:
  - When `isCustomTimerInput`:
    - If `customTimerInput.length() == 0`, display `"0 " + getString(R.string.kids_minutes_suffix)`.
    - Else display `customTimerInput.toString() + " " + getString(R.string.kids_minutes_suffix)`.
- In `submitPin()`:
  - If `isCustomTimerInput`:
    - Parse `int minutes = Integer.parseInt(customTimerInput.toString())`.
    - Bounds check `minutes = Math.min(Math.max(minutes, 1), 720)`.
    - Call `isCustomTimerInput = false; hideLockScreen(); selectTimer(minutes);`.
    - return.
- In `hideLockScreen()`:
  - Reset `isCustomTimerInput = false`.
  - Restore heading and subtitle texts.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd launcher && ./gradlew testDebugUnitTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add launcher/app/src/main/res/layout/overlay_kids_mode.xml launcher/app/src/main/java/com/gathin/tvhome/MainActivity.java launcher/app/src/test/java/com/gathin/tvhome/KidsLockFocusTest.java
git commit -m "feat(timer): add custom timer duration button and keypad input"
```

---

### Task 3: Full Build, Test & Physical Device / ADB Verification

**Files:**
- Binary: `launcher/app/build/outputs/apk/debug/app-debug.apk`

**Interfaces:**
- Consumes: Task 1 and Task 2 changes.
- Produces: Sideloaded APK on TV (`192.168.1.21:5555` or local emulator) and verified behavior.

- [ ] **Step 1: Run all unit test suites and build debug APK**

Run: `cd launcher && ./gradlew test assembleDebug`
Expected: BUILD SUCCESSFUL (all unit test suites pass).

- [ ] **Step 2: Check TV ADB connectivity and sideload APK**

Run: `adb devices -l`
If TV `192.168.1.21:5555` is connected:
`adb -s 192.168.1.21:5555 install -r -t -d -g launcher/app/build/outputs/apk/debug/app-debug.apk`
`adb -s 192.168.1.21:5555 shell am start -n com.gathin.tvhome/.MainActivity`

- [ ] **Step 3: Verify dynamic daily PIN and custom timer duration**

1. Verify Kids Mode overlay displays `[⏱️ Tùy chỉnh...]`.
2. Click `[⏱️ Tùy chỉnh...]`, enter "90" on keypad, press OK. Verify timer is set to 90 mins and status shows "Tắt sau 90 phút".
3. Trigger lock screen, enter today's `DDMM` (e.g. `3010`), verify TV unlocks immediately.

- [ ] **Step 4: Commit release verification**

```bash
git commit --allow-empty -m "chore(release): verified custom timer and dynamic DDMM PIN"
```
