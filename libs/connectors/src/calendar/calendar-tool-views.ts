import { lazy } from "react";
import type { ToolViewLibrary } from "@semoss/shared";

/**
 * The calendar views a tool can name as `component://calendar/<view>`, each
 * loaded when first shown. Every calendar shares them; the URI's `provider`
 * says which one a call reads.
 *
 * - `agenda`: the events `ListEvents` found.
 * - `event`: the event `GetEvent` read, or an answer to an invitation or a
 *   delete to approve (`intent=respond`, `intent=delete`).
 * - `event-edit`: an event to create or change to approve, editable, then
 *   the event as the calendar left it (`intent=create`, `intent=update`).
 * - `availability`: when the people `GetSchedule` asked about are taken.
 */
export const CALENDAR_TOOL_VIEWS: ToolViewLibrary = {
	agenda: lazy(() =>
		import("./calendar-agenda-tool-view").then((module) => ({
			default: module.CalendarAgendaToolView,
		})),
	),
	event: lazy(() =>
		import("./calendar-event-tool-view").then((module) => ({
			default: module.CalendarEventToolView,
		})),
	),
	"event-edit": lazy(() =>
		import("./calendar-event-edit-tool-view").then((module) => ({
			default: module.CalendarEventEditToolView,
		})),
	),
	availability: lazy(() =>
		import("./calendar-availability-tool-view").then((module) => ({
			default: module.CalendarAvailabilityToolView,
		})),
	),
};
