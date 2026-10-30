package com.gathin.tvhome;

import android.content.Context;
import android.content.SharedPreferences;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Manages Kids Mode PIN protection, sleep countdown timer, and screen lock state.
 */
public class KidsModeManager {

    private static final String PREFS_NAME = "kids_mode_prefs";
    private static final String KEY_PIN_HASH = "pin_hash";
    private static final String KEY_TARGET_SLEEP_MS = "target_sleep_ms";
    private static final String KEY_TIMER_MINUTES = "timer_minutes";
    private static final String KEY_IS_LOCKED = "is_locked";

    private static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static String getDailyDefaultPin(Date date) {
        return new SimpleDateFormat("ddMM", Locale.getDefault()).format(date);
    }

    public static String getDailyDefaultPin() {
        return getDailyDefaultPin(new Date());
    }

    public static String hashPin(String pin) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(pin.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String h = Integer.toHexString(0xff & b);
                if (h.length() == 1) hex.append('0');
                hex.append(h);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return pin;
        }
    }

    public static boolean verifyPin(Context context, String pin) {
        if (pin == null || pin.length() != 4) return false;
        SharedPreferences prefs = getPrefs(context);
        String savedHash = prefs.getString(KEY_PIN_HASH, null);
        if (savedHash == null) {
            return getDailyDefaultPin().equals(pin);
        }
        return hashPin(pin).equals(savedHash);
    }

    public static void setPin(Context context, String newPin) {
        if (newPin == null || newPin.length() != 4) return;
        getPrefs(context).edit().putString(KEY_PIN_HASH, hashPin(newPin)).apply();
    }

    public static boolean hasCustomPin(Context context) {
        return getPrefs(context).getString(KEY_PIN_HASH, null) != null;
    }

    public static void startTimer(Context context, int minutes) {
        long targetMs = System.currentTimeMillis() + (minutes * 60_000L);
        getPrefs(context).edit()
                .putLong(KEY_TARGET_SLEEP_MS, targetMs)
                .putInt(KEY_TIMER_MINUTES, minutes)
                .putBoolean(KEY_IS_LOCKED, false)
                .apply();
    }

    public static void cancelTimer(Context context) {
        getPrefs(context).edit()
                .putLong(KEY_TARGET_SLEEP_MS, 0L)
                .putInt(KEY_TIMER_MINUTES, 0)
                .putBoolean(KEY_IS_LOCKED, false)
                .apply();
    }

    public static boolean isTimerActive(Context context) {
        long targetMs = getPrefs(context).getLong(KEY_TARGET_SLEEP_MS, 0L);
        return targetMs > 0 && System.currentTimeMillis() < targetMs;
    }

    public static boolean isTimerExpired(Context context) {
        long targetMs = getPrefs(context).getLong(KEY_TARGET_SLEEP_MS, 0L);
        return targetMs > 0 && System.currentTimeMillis() >= targetMs;
    }

    public static int getRemainingMinutes(Context context) {
        long targetMs = getPrefs(context).getLong(KEY_TARGET_SLEEP_MS, 0L);
        if (targetMs <= 0) return 0;
        long diff = targetMs - System.currentTimeMillis();
        if (diff <= 0) return 0;
        return (int) Math.ceil((double) diff / 60_000L);
    }

    public static int getTimerMinutes(Context context) {
        return getPrefs(context).getInt(KEY_TIMER_MINUTES, 0);
    }

    public static boolean isLocked(Context context) {
        SharedPreferences prefs = getPrefs(context);
        return prefs.getBoolean(KEY_IS_LOCKED, false) || isTimerExpired(context);
    }

    public static void setLocked(Context context, boolean locked) {
        getPrefs(context).edit().putBoolean(KEY_IS_LOCKED, locked).apply();
    }

    public static void unlockAndReset(Context context) {
        getPrefs(context).edit()
                .putBoolean(KEY_IS_LOCKED, false)
                .putLong(KEY_TARGET_SLEEP_MS, 0L)
                .putInt(KEY_TIMER_MINUTES, 0)
                .apply();
    }
}
