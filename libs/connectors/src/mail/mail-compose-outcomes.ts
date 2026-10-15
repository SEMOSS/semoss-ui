import { useCallback, useSyncExternalStore } from "react";
import type { MailComposeAlternative } from "./mail-compose";

/** An operation the user ran in place of a compose call, and what it returned. */
export interface MailComposeOutcome {
	alternative: MailComposeAlternative;
	result: unknown;
}

/*
 * The operations run in place of a compose call that the agent has not been
 * told about yet, by call. They outlive the view, so closing and opening it
 * again, or the same call shown inline and in the sidebar, offers Back to the
 * Agent rather than the form, which would run the email a second time. An
 * entry is removed once the agent is told.
 */
const outcomes = new Map<string, MailComposeOutcome>();
const listeners = new Set<() => void>();

const notify = (): void => {
	for (const listener of listeners) {
		listener();
	}
};

const subscribe = (listener: () => void): (() => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

/**
 * Keep what the user ran in place of a call until the agent is told.
 *
 * @param callId - The call.
 * @param outcome - The operation and its result.
 */
export const stageMailComposeOutcome = (
	callId: string,
	outcome: MailComposeOutcome,
): void => {
	outcomes.set(callId, outcome);
	notify();
};

/**
 * Forget a call's staged operation, once the agent was told.
 *
 * @param callId - The call.
 */
export const clearMailComposeOutcome = (callId: string): void => {
	if (outcomes.delete(callId)) {
		notify();
	}
};

/**
 * What the user ran in place of a call, while the agent has not been told.
 *
 * @param callId - The call.
 * @return The operation and its result, or undefined.
 */
export const useMailComposeOutcome = (
	callId: string,
): MailComposeOutcome | undefined => {
	const read = useCallback(() => outcomes.get(callId), [callId]);
	return useSyncExternalStore(subscribe, read, read);
};
