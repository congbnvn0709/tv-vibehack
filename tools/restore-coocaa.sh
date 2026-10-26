#!/usr/bin/env bash
# Restore script for Coocaa / Skyworth SWTV-24AE-4K
# Re-enables all debloated packages and restores the Google TV stock launcher.
set -euo pipefail
cd "$(dirname "$0")/.."
TV_HOST="${TV_HOST:-192.168.1.21}"
export TV_HOST
echo "Restoring packages on Coocaa TV at $TV_HOST..."
tools/restore.sh examples/coocaa-swtv-24ae-4k/debloat.txt com.google.android.apps.tv.launcherx

echo "Re-enabling setupwraith and unsuspending packages..."
/opt/homebrew/bin/adb -s "$TV_HOST:5555" shell pm enable com.google.android.tungsten.setupwraith || true
/opt/homebrew/bin/adb -s "$TV_HOST:5555" shell pm unsuspend com.smartdevice.myapp || true
/opt/homebrew/bin/adb -s "$TV_HOST:5555" shell pm unsuspend com.sky.market || true
/opt/homebrew/bin/adb -s "$TV_HOST:5555" shell pm unsuspend com.mediatek.tv.retaildemo || true

echo "Restore complete!"
