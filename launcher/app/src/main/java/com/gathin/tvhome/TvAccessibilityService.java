package com.gathin.tvhome;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * System-wide accessibility service for Android TV.
 * Handles sleep timer execution, lock screen enforcement, and blocks external
 * app shortcuts when Kids Mode is locked.
 */
public class TvAccessibilityService extends AccessibilityService {

    private static TvAccessibilityService instance;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private static final long CHECK_INTERVAL_MS = 10_000L;

    private final Runnable timerChecker = new Runnable() {
        @Override
        public void run() {
            checkKidsTimer();
            handler.postDelayed(this, CHECK_INTERVAL_MS);
        }
    };

    public static TvAccessibilityService getInstance() {
        return instance;
    }

    @Override
    public void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        handler.post(timerChecker);
    }

    @Override
    public boolean onUnbind(Intent intent) {
        instance = null;
        handler.removeCallbacks(timerChecker);
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        instance = null;
        handler.removeCallbacks(timerChecker);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (KidsModeManager.isLocked(this)) {
            int code = event.getKeyCode();
            // Allow essential keys for PIN entry, navigation, volume and power
            if (isAllowedLockedKey(code)) {
                return super.onKeyEvent(event);
            }
            // Consume and block all other keys (app shortcuts, media, guide, inputs)
            return true;
        }
        return super.onKeyEvent(event);
    }

    private boolean isAllowedLockedKey(int code) {
        switch (code) {
            case KeyEvent.KEYCODE_DPAD_UP:
            case KeyEvent.KEYCODE_DPAD_DOWN:
            case KeyEvent.KEYCODE_DPAD_LEFT:
            case KeyEvent.KEYCODE_DPAD_RIGHT:
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_BACK:
            case KeyEvent.KEYCODE_HOME:
            case KeyEvent.KEYCODE_POWER:
            case KeyEvent.KEYCODE_SLEEP:
            case KeyEvent.KEYCODE_WAKEUP:
            case KeyEvent.KEYCODE_VOLUME_UP:
            case KeyEvent.KEYCODE_VOLUME_DOWN:
            case KeyEvent.KEYCODE_VOLUME_MUTE:
            case KeyEvent.KEYCODE_0:
            case KeyEvent.KEYCODE_1:
            case KeyEvent.KEYCODE_2:
            case KeyEvent.KEYCODE_3:
            case KeyEvent.KEYCODE_4:
            case KeyEvent.KEYCODE_5:
            case KeyEvent.KEYCODE_6:
            case KeyEvent.KEYCODE_7:
            case KeyEvent.KEYCODE_8:
            case KeyEvent.KEYCODE_9:
                return true;
            default:
                return false;
        }
    }

    public void checkKidsTimer() {
        if (KidsModeManager.isTimerExpired(this)) {
            KidsModeManager.setLocked(this, true);
            KidsModeManager.cancelTimer(this);
            lockAndSleep();
        }
    }

    public void lockAndSleep() {
        // Return to home first so the TV wakes up into the launcher lock screen
        performGlobalAction(GLOBAL_ACTION_HOME);
        handler.postDelayed(() -> performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN), 600L);
    }

    public void triggerSleep() {
        performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN);
    }

    public void triggerHome() {
        performGlobalAction(GLOBAL_ACTION_HOME);
    }
}
