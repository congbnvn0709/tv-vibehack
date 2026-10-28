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
