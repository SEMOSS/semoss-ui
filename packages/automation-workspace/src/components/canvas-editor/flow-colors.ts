import type { StepRunStatus } from "../../domain/automation.types";

/**
 * Shared color logic for the canvas so a step's card, its output handles, and its
 * edges all agree on how a run status or the "path to the selected node" highlight
 * should render — only the representation (inline color vs. Tailwind class) differs.
 */

/** Blue used wherever a step or edge sits on the path leading to the selected node. */
export const PATH_HIGHLIGHT_COLOR = "var(--primary)";

/** Tailwind border class matching `PATH_HIGHLIGHT_COLOR`, for node cards. */
export const PATH_HIGHLIGHT_BORDER_CLASS = "border-primary/60";

const RUN_STATUS_COLOR: Partial<Record<StepRunStatus, string>> = {
	running: "#3b82f6",
	success: "#10b981",
	error: "var(--destructive)",
};

const RUN_STATUS_BORDER_CLASS: Partial<Record<StepRunStatus, string>> = {
	running: "border-blue-500/70",
	success: "border-emerald-500/60",
	error: "border-destructive/60",
};

/** Inline color for an edge or output handle: the path highlight wins, then run status, then the default. */
export function getFlowStrokeColor(
	runStatus: StepRunStatus | undefined,
	isPathHighlighted: boolean,
	defaultColor: string,
): string {
	if (isPathHighlighted) return PATH_HIGHLIGHT_COLOR;
	const runColor = runStatus && RUN_STATUS_COLOR[runStatus];
	if (runColor) return runColor;
	return defaultColor;
}

/** Tailwind border class for a node card, mirroring `getFlowStrokeColor`'s priority. */
export function getFlowBorderClass(
	runStatus: StepRunStatus | undefined,
	isPathHighlighted: boolean,
	fallbackClass: string,
): string {
	if (isPathHighlighted) return PATH_HIGHLIGHT_BORDER_CLASS;
	const runClass = runStatus && RUN_STATUS_BORDER_CLASS[runStatus];
	if (runClass) return runClass;
	return fallbackClass;
}
