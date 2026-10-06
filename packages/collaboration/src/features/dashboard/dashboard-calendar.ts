import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { calendarUtc } from "@/features/connectors/api/source-mapping";
import { dayKey } from "./dashboard-selectors";

/** Civil calendar dates advance without losing or repeating a day at DST boundaries. */
export function agendaDays(now: Date, timeZone: string): Date[] {
	const today = dayKey(now, timeZone);
	return Array.from({ length: 7 }, (_, index) => {
		const day = new Date(`${today}T12:00:00Z`);
		day.setUTCDate(day.getUTCDate() + index);
		return day;
	});
}

/** Invalid provider dates stay visible as unscheduled rather than crashing the dashboard. */
export function eventStart(event: CalendarEvent): Date | null {
	try {
		const value = calendarUtc(event.start, event.startTimeZone);
		return value ? new Date(value) : null;
	} catch {
		return null;
	}
}

/** Old profiles may contain a Windows zone; fall back to the device's local zone. */
export function dashboardTimeZone(zone: string): string {
	try {
		new Intl.DateTimeFormat("en", { timeZone: zone }).format();
		return zone;
	} catch {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	}
}
