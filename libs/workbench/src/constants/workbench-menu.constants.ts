import type { WorkbenchMenuLabel, WorkbenchMenuTranslate } from "../types";

/** English defaults for hosts that do not supply translated menu copy. */
const MENU_LABELS: Record<WorkbenchMenuLabel, string> = {
	view: "View",
	navigate: "Navigate",
	commandPalette: "Command Palette…",
	layout: "Layout",
	single: "Combine into One Group",
	columns: "Two Columns",
	rows: "Two Rows",
	balance: "Balance Pane Sizes",
	left: "Left Side Area",
	right: "Right Side Area",
	top: "Top Area",
	bottom: "Bottom Area",
	previous: "Previous Panel",
	next: "Next Panel",
	openPanels: "Open Panels",
	noPanels: "No open panels",
	maximize: "Maximize Work Area",
	restore: "Restore Work Area",
};

/** Resolve the dock's default copy without depending on an application's i18n. */
export const getWorkbenchMenuLabel: WorkbenchMenuTranslate = (key) =>
	MENU_LABELS[key];
