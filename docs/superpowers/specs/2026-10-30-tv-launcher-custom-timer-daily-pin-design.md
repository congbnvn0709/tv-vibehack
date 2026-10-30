# Design Spec: TV Launcher Custom Sleep Timer & Dynamic Daily PIN (DDMM)

- **Date:** 2026-10-30
- **Status:** Proposed
- **Target Platform:** Android TV 5.0 - 14+ (`minSdk 21`, `targetSdk 29`, `compileSdk 34`)
- **Package:** `com.gathin.tvhome`

---

## 1. Intent and The Why

In the TV Launcher (`com.gathin.tvhome`), the Sleep Timer & Kids Mode currently supports only hardcoded duration presets (15, 30, 45, 60 minutes) and uses a static hardcoded default PIN (`0000`).
1. **User Need 1:** Allow users to set any custom sleep duration in minutes (e.g., 20 mins, 90 mins, 120 mins).
2. **User Need 2:** Make the default PIN dynamic and change daily based on the system date in 4-digit format `DDMM` (Day and Month, e.g., on October 30 -> PIN is `3010`), while preserving the ability for parents to set their own permanent custom 4-digit PIN.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Dynamic Daily Default PIN (4 Digits `DDMM`):**
  - If no custom PIN has been set, the default PIN is dynamically calculated from the TV system date in `ddMM` format (e.g., October 30 -> `3010`, January 5 -> `0501`).
  - Preserves 4-digit PIN length so all existing PIN numpad dots (`○ ○ ○ ○`) and validation logic remain fast, responsive, and seamless.
- **Custom PIN Support Retained:**
  - Parents can still choose "Đổi mã PIN" / "Change PIN" to set a custom 4-digit PIN.
  - If a custom PIN is saved in SharedPreferences, it takes precedence over the daily default PIN.
- **Custom Sleep Timer Duration:**
  - Add a `[⏱️ Tùy chỉnh]` / `[⏱️ Custom]` button to the Kids Mode / Timer overlay alongside the existing 15, 30, 45, 60, Off buttons.
  - Reuses the existing clean, remote-friendly 3x4 on-screen keypad to enter the desired minutes (1 - 720 minutes).
  - Pressing `OK` on the keypad immediately starts the timer for the entered minutes and updates the top-bar pill.

### Non-Goals
- Spawning the system software keyboard (Gboard/Leanback IME), which would obstruct the TV display.
- Changing PIN length beyond 4 digits.

### Anti-Goals
- Breaking TV remote control focus navigation or causing focus to escape the 3x4 numpad.
- Losing timer persistence across activity recreations.

---

## 3. Approaches Considered and Selected

### Problem 1: Custom Timer Duration Input
- **Approach A (Android TV Virtual Keyboard / IME):** Pop up an `EditText` for the OS keyboard.
  - *Trade-off:* Obstructive full-screen IME, poor D-Pad navigation ergonomics.
- **Approach B (Reusing 3x4 On-Screen Keypad) [SELECTED]:**
  - Switch the existing 3x4 numpad overlay to "Custom Timer Input" mode when `btnTimerCustom` is clicked.
  - Heading: "Nhập số phút hẹn giờ (1 - 720 phút):" / "Enter sleep timer minutes (1 - 720 mins):".
  - Display entered digits directly. Clicking `OK` confirms; `⌫` deletes a digit.
  - *Trade-off:* Ergonomic, remote-friendly, 100% consistent with existing UI and 2D focus traps.

### Problem 2: Dynamic Default PIN Format
- **Approach A (6-digit `DDMMYY`):**
  - *Trade-off:* Requires changing dot indicators from 4 to 6, modifying numpad auto-submit logic, and changing custom PIN storage conventions.
- **Approach B (4-digit `DDMM`) [SELECTED]:**
  - Format `ddMM` (e.g. October 30 -> `3010`).
  - *Trade-off:* Perfectly preserves 4-digit layout, dots, and auto-submit timing, while meeting the user's explicit preference ("để pin 4 số cũng được bỏ năm đi chỉ DDMM thôi").

---

## 4. Detailed Technical Architecture

### 1. `KidsModeManager.java`
- Introduce method:
  ```java
  public static String getDailyDefaultPin() {
      return new SimpleDateFormat("ddMM", Locale.getDefault()).format(new Date());
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

### 2. Layout & Strings: `overlay_kids_mode.xml`
- Add `btnTimerCustom` between `btnTimer60` and `btnTimerOff`:
  - `android:id="@+id/btnTimerCustom"`
  - `style="@style/SettingOption"`
  - `android:text="@string/kids_btn_custom"`
- String resources:
  - English (`values/strings.xml`):
    - `kids_btn_custom`: `"⏱️ Custom..."`
    - `kids_prompt_custom_timer`: `"Enter timer minutes (1 - 720):"`
    - `kids_pin_default_hint`: `"Default PIN is today's date (DDMM, e.g. 3010)."`
  - Vietnamese (`values-vi/strings.xml`):
    - `kids_btn_custom`: `"⏱️ Tùy chỉnh..."`
    - `kids_prompt_custom_timer`: `"Nhập số phút hẹn giờ (1 - 720):"`
    - `kids_pin_default_hint`: `"Mã PIN mặc định là ngày/tháng hôm nay (DDMM, ví dụ: 3010)."`

### 3. Keypad Reusability: `MainActivity.java`
- Introduce state enum or boolean `isCustomTimerInput`:
  - If `isCustomTimerInput == true`:
    - Title/subtitle displays `kids_prompt_custom_timer`.
    - `txtPinDots` displays the actual number entered (e.g. "90 phút" / "90 mins") instead of masked circles.
    - Pressing digits appends to `customTimerMinutes` (up to 3 digits, max 720).
    - Pressing `padEnter` confirms: invokes `selectTimer(minutes)`.
    - Pressing `padClear` deletes the last digit.
    - Back key or exiting cancels and returns to Kids Settings overlay.

---

## 5. Verification Plan
1. **Unit Tests:**
   - Test `KidsModeManager.getDailyDefaultPin()` against mock/fixed dates (e.g. 30/10 -> `3010`).
   - Test `KidsModeManager.verifyPin()` with daily default PIN and custom PIN overrides.
2. **Build Verification:**
   - `./gradlew testDebugUnitTest assembleDebug`
3. **Physical / ADB Verification on TV:**
   - Launch `MainActivity`.
   - Open Kids Mode -> Click `[⏱️ Tùy chỉnh...]` -> Enter "90" -> Press OK -> Verify timer status reads "Tắt sau 90 phút".
   - Trigger Lock Screen -> Enter today's `DDMM` (e.g. `3010`) -> Verify TV unlocks successfully.
