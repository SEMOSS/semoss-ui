import { lazy } from "react";
import { CALENDAR_TOOL_VIEWS, MAIL_TOOL_VIEWS } from "@semoss/connectors";
import type { ToolViewLibraries } from "@semoss/shared";

/** Stable registrations shared by inline tool calls and the room's workbench. */
export const TOOL_VIEW_LIBRARIES: ToolViewLibraries = {
	mail: MAIL_TOOL_VIEWS,
	calendar: CALENDAR_TOOL_VIEWS,
	collaboration: {
		tool: lazy(() =>
			import("./collaboration-tool-view").then((module) => ({
				default: module.CollaborationToolView,
			})),
		),
	},
};
