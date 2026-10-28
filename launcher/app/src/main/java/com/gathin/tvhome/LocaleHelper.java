package com.gathin.tvhome;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;
import java.util.Locale;

public class LocaleHelper {
    public static final String PREFS_NAME = "tvhome_prefs";
    public static final String KEY_APP_LANGUAGE = "app_language";
    public static final String LANG_AUTO = "auto";
    public static final String LANG_VI = "vi";
    public static final String LANG_EN = "en";

    /**
     * Resolves a language code to a {@link Locale}.
     * Returns null for "auto", null, or empty string, signifying system default.
     */
    public static Locale resolveLocale(String langCode) {
        if (langCode == null || langCode.isEmpty() || LANG_AUTO.equalsIgnoreCase(langCode)) {
            return null;
        }
        if (LANG_VI.equalsIgnoreCase(langCode)) {
            return new Locale("vi");
        }
        if (LANG_EN.equalsIgnoreCase(langCode)) {
            return Locale.ENGLISH;
        }
        return new Locale(langCode);
    }

    /**
     * Returns the persisted language code from SharedPreferences, default "auto".
     */
    public static String getPersistedLocale(Context context) {
        if (context == null) {
            return LANG_AUTO;
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_APP_LANGUAGE, LANG_AUTO);
    }

    /**
     * Persists the selected language code to SharedPreferences.
     */
    public static void setPersistedLocale(Context context, String langCode) {
        if (context == null) {
            return;
        }
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_APP_LANGUAGE, langCode != null ? langCode : LANG_AUTO).apply();
    }

    /**
     * Applies the given locale code to the context and returns the updated context.
     */
    public static Context applyLocale(Context context, String langCode) {
        if (context == null) {
            return null;
        }

        Locale targetLocale = resolveLocale(langCode);
        if (targetLocale == null) {
            targetLocale = Resources.getSystem().getConfiguration().locale;
        }

        Locale.setDefault(targetLocale);

        Configuration config = new Configuration(context.getResources().getConfiguration());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
            config.setLocale(targetLocale);
            context.getResources().updateConfiguration(config, context.getResources().getDisplayMetrics());
            return context.createConfigurationContext(config);
        } else {
            config.locale = targetLocale;
            context.getResources().updateConfiguration(config, context.getResources().getDisplayMetrics());
            return context;
        }
    }

    /**
     * Applies the persisted locale to the context.
     */
    public static Context applyLocale(Context context) {
        return applyLocale(context, getPersistedLocale(context));
    }
}
