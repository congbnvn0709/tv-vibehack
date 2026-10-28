package com.gathin.tvhome;

import static org.junit.Assert.assertEquals;
import org.junit.Test;
import java.util.Calendar;

public class CalendarLogicTest {

    @Test
    public void testFirstDayOfWeekCalculation() {
        Calendar cal = Calendar.getInstance();
        cal.set(2026, Calendar.OCTOBER, 1);
        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0=Sunday
        // Oct 1, 2026 is Thursday -> Calendar.THURSDAY is 5 -> 5 - 1 = 4
        assertEquals(4, firstDayOfWeek);
    }

    @Test
    public void testOctober2026GridCalculations() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.YEAR, 2026);
        cal.set(Calendar.MONTH, Calendar.OCTOBER);
        cal.set(Calendar.DAY_OF_MONTH, 1);

        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1;
        int daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);

        Calendar prevCal = (Calendar) cal.clone();
        prevCal.add(Calendar.MONTH, -1);
        int daysInPrevMonth = prevCal.getActualMaximum(Calendar.DAY_OF_MONTH);

        assertEquals(4, firstDayOfWeek);
        assertEquals(31, daysInMonth);
        assertEquals(30, daysInPrevMonth);

        // Previous month days in October 2026 (first 4 cells)
        int cellIndex = 0;
        int pDay0 = daysInPrevMonth - (firstDayOfWeek - 1 - cellIndex);
        assertEquals(27, pDay0);

        cellIndex = 3;
        int pDay3 = daysInPrevMonth - (firstDayOfWeek - 1 - cellIndex);
        assertEquals(30, pDay3);
    }

    @Test
    public void testNextMonthDaysCalculation() {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.YEAR, 2026);
        cal.set(Calendar.MONTH, Calendar.FEBRUARY);
        cal.set(Calendar.DAY_OF_MONTH, 1);

        int firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1;
        int daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH);

        // Feb 1, 2026 is Sunday -> 0
        assertEquals(0, firstDayOfWeek);
        assertEquals(28, daysInMonth);

        // Next month days start at cellIndex 28 (dayCounter > 28)
        int nextMonthDayCounter = 1;
        for (int i = 28; i < 35; i++) {
            assertEquals(i - 27, nextMonthDayCounter++);
        }
    }
}
