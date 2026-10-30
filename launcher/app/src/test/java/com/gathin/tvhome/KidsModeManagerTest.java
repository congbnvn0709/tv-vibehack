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
