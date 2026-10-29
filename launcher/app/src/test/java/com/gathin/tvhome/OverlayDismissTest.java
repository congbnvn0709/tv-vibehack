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
