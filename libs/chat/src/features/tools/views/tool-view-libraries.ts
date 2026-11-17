import { CALENDAR_TOOL_VIEWS, MAIL_TOOL_VIEWS } from "@semoss/connectors";
import type { ToolViewLibraries } from "@semoss/shared";

/**
 * The `component://` libraries the playground draws tool views from. Module
 * scope matters: a new object would draw every tool view again.
 */
export const TOOL_VIEW_LIBRARIES: ToolViewLibraries = {
	mail: MAIL_TOOL_VIEWS,
	calendar: CALENDAR_TOOL_VIEWS,
};
