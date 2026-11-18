import type { CalendarEvent } from "@/features/connectors/api/microsoft-schemas";
import { calendarUtc } from "@/features/connectors/api/source-mapping";

/** Invalid provider dates stay visible as unscheduled rather than crashing the dashboard. */
export function eventStart(event: CalendarEvent): Date | null {
	try {
		const value = calendarUtc(event.start);
		return value ? new Date(value) : null;
	} catch {
		return null;
	}
}

/** A whole day event starts with its date alone: that day in every zone, with no time of its own. */
export function isAllDay(event: CalendarEvent): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(event.start ?? "");
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
