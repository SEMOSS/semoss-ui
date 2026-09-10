import type { StoreApi } from "zustand";
import favicon from "@/assets/favicon.svg";
import { notifyIfPageInactive } from "@/utility";
import type { BuildRun } from "./assistant.runs";
import { isTerminalAgentRunStatus } from "./assistant.runs";
import type { AssistantState } from "./assistant.store";
import { isRequestUserInputAction } from "./assistant.tools";

/** Max characters of assistant text quoted in a notification body. */
const BODY_MAX_LENGTH = 120;

/** Room label used before the room has been named. */
const DEFAULT_ROOM_LABEL = "Workbench assistant";

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
 * Watches the assistant store and raises a browser
 * notification when a root assistant run pauses for input or finishes, but only
 * while the user is away from the page.
 *
 * Attached to the store rather than a React effect so it is active for the
 * store's lifetime instead of a component's, and so the transition logic is
 * testable without mounting anything.
 *
 * Only root runs (`roomRunIds`) are considered, so a subagent finishing mid-run
 * never notifies. Runs with no previous entry are skipped — resuming a room
 * replaces the run store wholesale, and that guard is what keeps a room full of
 * already-finished runs silent.
 *
 * @name attachAssistantNotifications
 * @param api - The assistant store to watch.
 * @return Unsubscribe, called from the store's `dispose()`.
 */
export const attachAssistantNotifications = (
	api: StoreApi<AssistantState>,
): (() => void) =>
	api.subscribe((state, previous) => {
		// State is always defined once the store is built; this only guards
		// the theoretical case of a set() during construction.
		if (!state || !previous) return;

		const room = state.roomName || DEFAULT_ROOM_LABEL;

		for (const runId of state.roomRunIds) {
			const run = state.runs[runId];
			const before = previous.runs[runId];
			if (!run || !before) continue;

			const notification = describeTransition(run, before.status, room);
			if (!notification) continue;

			notifyIfPageInactive({
				...notification,
				icon: favicon,
				tag: runId,
			});
		}
	});
