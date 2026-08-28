import favicon from "@/assets/favicon.svg";
import { notifyIfPageInactive } from "@/utility";
import type { WorkbenchSlice } from "../workbench.types";
import type { BuildRun } from "./workbench-assistant.runs";
import { isTerminalAgentRunStatus } from "./workbench-assistant.runs";
import { isRequestUserInputAction } from "./workbench-assistant.tools";

/** Max characters of assistant text quoted in a notification body. */
const BODY_MAX_LENGTH = 120;

/** Room label used before the room has been named. */
const DEFAULT_ROOM_LABEL = "Workbench assistant";

/** Namespaced state contributed by the assistant notification slice. */
export interface WorkbenchAssistantNotificationSliceState {
	/**
	 * Stop watching run transitions. The subscription otherwise lives as long
	 * as the store and is garbage-collected with it, so the app never needs to
	 * call this — it exists so tests can detach a watcher.
	 */
	dispose: () => void;
}

/**
 * Normalize a run status for comparison.
 *
 * @name normalizeStatus
 * @param status - Raw status from the run record.
 * @return The trimmed, upper-cased status, or an empty string when absent.
 */
const normalizeStatus = (status?: string): string =>
	(status ?? "").trim().toUpperCase();

/**
 * Collapse whitespace and clip text to a notification-sized body.
 *
 * @name summarize
 * @param text - Text to quote; may be empty or undefined.
 * @param fallback - Body used when there is no text to quote.
 * @return A single-line body of at most BODY_MAX_LENGTH characters.
 */
const summarize = (text: string | undefined, fallback: string): string => {
	const collapsed = (text ?? "").replace(/\s+/g, " ").trim();
	if (!collapsed) return fallback;
	return collapsed.length > BODY_MAX_LENGTH
		? `${collapsed.slice(0, BODY_MAX_LENGTH - 1)}…`
		: collapsed;
};

/**
 * Describe why a paused run needs the user. INPUT_REQUIRED covers both
 * tool-permission approvals and RequestUserInput question sets, so the body
 * branches on which kind of action is pending.
 *
 * @name describePendingActions
 * @param run - The paused run.
 * @return Body text for the "needs your input" notification.
 */
const describePendingActions = (run: BuildRun): string => {
	if (run.pendingActions.some(isRequestUserInputAction)) {
		return "The assistant needs an answer to continue.";
	}
	const count = run.pendingActions.length;
	if (count === 0) return "The assistant is waiting for your input.";
	return count === 1
		? "1 approval is required to continue."
		: `${count} approvals are required to continue.`;
};

/**
 * Notification for one root-run status transition, or null when the transition
 * warrants none. Split out from the subscriber so the mapping is unit-testable
 * without a store.
 *
 * @name describeTransition
 * @param run - The run in its new state.
 * @param previousStatus - The run's status before this update.
 * @param room - Display name of the room the run belongs to.
 * @return Title and body for the notification, or null to stay silent.
 */
const describeTransition = (
	run: BuildRun,
	previousStatus: string,
	room: string,
): { title: string; body: string } | null => {
	const next = normalizeStatus(run.status);
	const prev = normalizeStatus(previousStatus);
	if (next === prev) return null;

	if (next === "INPUT_REQUIRED") {
		return {
			title: `${room} — Input needed`,
			body: describePendingActions(run),
		};
	}

	// Only the crossing into a terminal status notifies, so a durable
	// reconcile re-asserting the same status stays silent.
	if (isTerminalAgentRunStatus(prev) || !isTerminalAgentRunStatus(next)) {
		return null;
	}

	if (next === "COMPLETED") {
		return {
			title: `${room} — Response ready`,
			body: summarize(
				run.finalText,
				"The assistant completed your request.",
			),
		};
	}
	if (next === "CANCELLED") {
		return {
			title: `${room} — Run cancelled`,
			body: summarize(run.errorMessage, "The run was cancelled."),
		};
	}
	return {
		title: `${room} — Run failed`,
		body: summarize(run.errorMessage, "The run failed before completing."),
	};
};

/**
 * Creates the `notifications` slice: a store subscription that raises a browser
 * notification when a root assistant run pauses for input or finishes, but only
 * while the user is away from the page.
 *
 * Lives in the store rather than a React effect so it is active for the store's
 * lifetime instead of a component's, and so the transition logic is testable
 * without mounting anything. Zustand builds `subscribe` before it invokes this
 * creator, so subscribing here is safe.
 *
 * Only root runs (`assistant.roomRunIds`) are considered, so a subagent finishing
 * mid-run never notifies. Runs with no previous entry are skipped — resuming a
 * room replaces the run store wholesale, and that guard is what keeps a room
 * full of already-finished runs silent.
 *
 * @name createWorkbenchAssistantNotificationSlice
 * @return Zustand state creator contributing the `notifications` key.
 */
export const createWorkbenchAssistantNotificationSlice =
	(): WorkbenchSlice<WorkbenchAssistantNotificationSliceState> =>
	(_set, _get, api) => {
		const unsubscribe = api.subscribe((state, previous) => {
			// State is always defined once the store is built; this only
			// guards the theoretical case of a set() during construction.
			if (!state?.assistant || !previous?.assistant) return;

			const room = state.assistant.roomName || DEFAULT_ROOM_LABEL;

			for (const runId of state.assistant.roomRunIds) {
				const run = state.assistant.runs[runId];
				const before = previous.assistant.runs[runId];
				if (!run || !before) continue;

				const notification = describeTransition(
					run,
					before.status,
					room,
				);
				if (!notification) continue;

				notifyIfPageInactive({
					...notification,
					icon: favicon,
					tag: runId,
				});
			}
		});

		return { dispose: unsubscribe };
	};
