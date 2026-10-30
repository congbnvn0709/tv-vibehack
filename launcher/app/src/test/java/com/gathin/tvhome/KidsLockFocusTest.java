package com.gathin.tvhome;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;
import java.io.File;
import java.nio.file.Files;

public class KidsLockFocusTest {

    @Test
    public void testKidsLockNumpadHasExplicitFocusAttributes() throws Exception {
        File file = new File("src/main/res/layout/overlay_kids_lock.xml");
        if (!file.exists()) {
            file = new File("app/src/main/res/layout/overlay_kids_lock.xml");
        }
        assertTrue("overlay_kids_lock.xml should exist", file.exists());
        String content = new String(Files.readAllBytes(file.toPath()));

        // Check each pad button ID
        String[] padIds = {
            "pad1", "pad2", "pad3",
            "pad4", "pad5", "pad6",
            "pad7", "pad8", "pad9",
            "padClear", "pad0", "padEnter"
        };
        for (String id : padIds) {
            assertTrue("Keypad must contain id @" + id, content.contains("android:id=\"@+id/" + id + "\""));
        }

        // Row 1
        assertTrue(content.contains("android:nextFocusLeft=\"@id/pad1\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/pad2\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/pad1\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad4\""));

        assertTrue(content.contains("android:nextFocusRight=\"@id/pad3\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/pad2\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad5\""));

        assertTrue(content.contains("android:nextFocusRight=\"@id/pad3\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/pad3\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad6\""));

        // Row 2 & 3
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad7\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad8\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad9\""));

        // Row 4
        assertTrue(content.contains("android:id=\"@+id/pad0\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/pad8\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/pad0\""));
        assertTrue(content.contains("android:nextFocusLeft=\"@id/padClear\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/padEnter\""));

        // Bottom corners stay trapped inside
        assertTrue(content.contains("android:nextFocusLeft=\"@id/padClear\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/padClear\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/padEnter\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/padEnter\""));

        // Localized strings
        assertTrue(content.contains("@string/kids_locked_heading"));
        assertTrue(content.contains("@string/kids_locked_subtitle"));
    }

    @Test
    public void testOverlayKidsModeUsesStringResources() throws Exception {
        File file = new File("src/main/res/layout/overlay_kids_mode.xml");
        if (!file.exists()) {
            file = new File("app/src/main/res/layout/overlay_kids_mode.xml");
        }
        assertTrue("overlay_kids_mode.xml should exist", file.exists());
        String content = new String(Files.readAllBytes(file.toPath()));

        assertTrue(content.contains("@string/kids_title"));
        assertTrue(content.contains("@string/kids_btn_15"));
        assertTrue(content.contains("@string/kids_btn_30"));
        assertTrue(content.contains("@string/kids_btn_45"));
        assertTrue(content.contains("@string/kids_btn_60"));
        assertTrue(content.contains("@string/kids_btn_off"));
        assertTrue(content.contains("@string/kids_change_pin"));
        assertTrue(content.contains("@string/kids_lock_now"));
        assertTrue(content.contains("@string/kids_btn_custom"));
        assertTrue(content.contains("@string/kids_pin_default_hint"));

        assertFalse(content.contains("android:text=\"15 phút\""));
        assertFalse(content.contains("android:text=\"30 phút\""));
        assertFalse(content.contains("android:text=\"45 phút\""));
        assertFalse(content.contains("android:text=\"60 phút\""));
        assertFalse(content.contains("android:text=\"Tắt hẹn giờ\""));
        assertFalse(content.contains("Mã PIN mặc định ban đầu là: 0000"));
    }

    @Test
    public void testKidsModeOverlayContainsCustomTimerButton() throws Exception {
        File file = new File("src/main/res/layout/overlay_kids_mode.xml");
        if (!file.exists()) {
            file = new File("app/src/main/res/layout/overlay_kids_mode.xml");
        }
        assertTrue("overlay_kids_mode.xml should exist", file.exists());
        String content = new String(Files.readAllBytes(file.toPath()));
        assertTrue("overlay_kids_mode.xml must contain btnTimerCustom", content.contains("android:id=\"@+id/btnTimerCustom\""));
    }

    @Test
    public void testKidsModeOverlayHasExplicit2DFocusMatrix() throws Exception {
        File file = new File("src/main/res/layout/overlay_kids_mode.xml");
        if (!file.exists()) {
            file = new File("app/src/main/res/layout/overlay_kids_mode.xml");
        }
        assertTrue("overlay_kids_mode.xml should exist", file.exists());
        String content = new String(Files.readAllBytes(file.toPath()));

        // Header close button connects to first timer option
        assertTrue(content.contains("android:nextFocusDown=\"@id/btnTimer15\""));

        // Horizontal chain across timer buttons prevents premature jump down
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnTimer30\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnTimer45\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnTimer60\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnTimerCustom\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnTimerOff\""));

        // Security row navigation
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnKidsLockNow\""));
        assertTrue(content.contains("android:nextFocusUp=\"@id/btnTimer15\""));
    }
}
