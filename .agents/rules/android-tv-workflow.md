---
trigger: always_on
description: "Best practices and troubleshooting rules for Android TV & Google TV (Android 11+ / 14)"
---

# Android TV & Google TV Engineering Rules

## 1. Wireless ADB & TLS Pairing (Android 11+)
- Always prefer official `adb` binary over pure-python `adb-shell` for initial connection due to TLS (`STLS`) requirements.
- Pairing via `adb pair <ip>:<port> <code>` creates permanent credentials in `~/.android/adbkey`. Do NOT ask user to re-pair after reboots; reconnect via mDNS or `adb connect`.
- Use `adb tcpip 5555` to bind classic port when needed.

## 2. Debloating & Protected System Packages
- For standard packages: `pm disable-user --user 0 <pkg>`.
- For packages throwing `SecurityException` on Android 14: use `pm suspend <pkg>` (restore with `pm unsuspend <pkg>`).
- When piping in shell loops, always redirect stdin `< /dev/null` to prevent `adb shell` from consuming the stream.

## 3. Launcher Replacement & Recovery Traps
- When disabling Google TV launcherx, always check resolved HOME intent: `cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME`.
- If intercepted by `setupwraith/.RecoveryActivity`, disable `com.google.android.tungsten.setupwraith` and re-assign with `cmd package set-home-activity --user 0 <launcher_activity>`.

## 4. APK Deployment on Modern Android TV
- If hit with `INSTALL_FAILED_VERIFICATION_FAILURE`, disable verifiers:
  `settings put global package_verifier_enable 0`
  `settings put global verifier_verify_adb_installs 0`
- Install with: `adb install -r -t -d -g <apk>`.
