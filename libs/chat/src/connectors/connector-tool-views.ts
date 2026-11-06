import { CALENDAR_TOOL_VIEWS, MAIL_TOOL_VIEWS } from "@semoss/connectors";
import type { ToolViewLibraries } from "@semoss/shared";

/**
 * The connectors' `component://` tool view libraries (`mail`, `calendar`),
 * for `ChatHostConfig.toolViewLibraries`. Module scope matters: a new object
 * would draw every tool view again.
 */
export const CONNECTOR_TOOL_VIEW_LIBRARIES: ToolViewLibraries = {
	mail: MAIL_TOOL_VIEWS,
	calendar: CALENDAR_TOOL_VIEWS,
};
