package com.gathin.tvhome;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import org.junit.Test;
import java.io.File;
import java.nio.file.Files;

public class SettingsFocusMatrixTest {

    @Test
    public void testOverlaySettingsContainsLanguageAndFocusMatrix() throws Exception {
        File file = new File("src/main/res/layout/overlay_settings.xml");
        if (!file.exists()) {
            file = new File("app/src/main/res/layout/overlay_settings.xml");
        }
        assertTrue("overlay_settings.xml file should exist", file.exists());
        String content = new String(Files.readAllBytes(file.toPath()));

        // Buttons and cards exist
        String[] requiredIds = {
            "btnSettingsClose",
            "btnLangAuto",
            "btnLangVi",
            "btnLangEn",
            "btnTopStyleText",
            "btnTopStyleIcon",
            "btnPeekUltra",
            "btnPeekBalanced",
            "btnPeekNone",
            "btnWallAuto",
            "btnWallDay",
            "btnWallNight",
            "btnSysSettings",
            "btnSysWifi",
            "btnSysApps"
        };
        for (String id : requiredIds) {
            assertTrue("overlay_settings.xml must contain id: " + id, content.contains(id));
        }

        // Focus navigation attributes
        assertTrue(content.contains("android:nextFocusLeft"));
        assertTrue(content.contains("android:nextFocusRight"));
        assertTrue(content.contains("android:nextFocusUp"));
        assertTrue(content.contains("android:nextFocusDown"));

        // Language buttons explicit focus links
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnLangVi\""));
        assertTrue(content.contains("android:nextFocusRight=\"@id/btnLangEn\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/btnTopStyleText\""));
        assertTrue(content.contains("android:nextFocusDown=\"@id/btnTopStyleIcon\""));

        // No hardcoded Turkish strings in layout text attributes
        assertFalse(content.contains("android:text=\"Ayarlar"));
        assertFalse(content.contains("android:text=\"Duvar"));
        assertFalse(content.contains("android:text=\"Otomatik"));
        assertFalse(content.contains("android:text=\"Gündüz"));
        assertFalse(content.contains("android:text=\"Gece"));
        assertFalse(content.contains("android:text=\"Sistem Ayarları"));
    }
}
