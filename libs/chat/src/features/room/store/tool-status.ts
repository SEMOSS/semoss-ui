import type { ToolOutcome } from "../../../types";

/** Where a tool call stands. */
export type ToolStatus =
	| "INITIAL"
	| "LOADING"
	| "CANCELLED"
	| "SUCCESS"
	| "ERROR";

/**
 * The status a call that ended this way has. Anything but an error or a
 * cancel counts as a success, as a server tool's result with no status does.
 *
 * @param outcome - How the call ended.
 * @returns Its status.
 */
export const toToolStatus = (outcome: ToolOutcome): ToolStatus =>
	outcome === "error"
		? "ERROR"
		: outcome === "cancelled"
			? "CANCELLED"
			: "SUCCESS";

/**
 * Whether a call has finished: it succeeded, failed, or was cancelled. A call
 * that has yet to run or is running has not.
 *
 * @param status - Where the call stands.
 * @returns Whether it has settled.
 */
export const isToolSettled = (status: ToolStatus): boolean =>
	status === "SUCCESS" || status === "ERROR" || status === "CANCELLED";
