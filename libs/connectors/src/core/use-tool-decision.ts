import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage } from "@semoss/utility/error";

/** A decision a tool view makes about its call. */
export type ToolDecisionKind = "approve" | "deny" | "alternative" | "respond";

/** What {@link useToolDecision} returns. */
export interface ToolDecision {
	/** The decision being made, if one is. Every action waits for it. */
	pending: ToolDecisionKind | null;
	/** Why the last decision failed, for the view to show. */
	error: string | null;
	/**
	 * Make a decision. A second one while the first runs is ignored.
	 *
	 * @param kind - Which decision it is.
	 * @param action - What makes it.
	 */
	decide: (kind: ToolDecisionKind, action: () => Promise<void>) => void;
}

/**
 * One decision at a time for a tool view: approving, denying, running the
 * operation offered instead, or telling the agent what the user did. A failed
 * decision keeps the view as it was and says why.
 *
 * @return The decision state and the way to make one.
 */
export const useToolDecision = (): ToolDecision => {
	const [pending, setPending] = useState<ToolDecisionKind | null>(null);
	const [error, setError] = useState<string | null>(null);
	// read synchronously, so a second click before the next render is ignored
	const pendingRef = useRef<ToolDecisionKind | null>(null);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	const decide = useCallback(
		(kind: ToolDecisionKind, action: () => Promise<void>) => {
			if (pendingRef.current) {
				return;
			}
			pendingRef.current = kind;
			setPending(kind);
			setError(null);
			action()
				.catch((cause: unknown) => {
					if (isMountedRef.current) {
						setError(getErrorMessage(cause));
					}
				})
				.finally(() => {
					pendingRef.current = null;
					if (isMountedRef.current) {
						setPending(null);
					}
				});
		},
		[],
	);

	return { pending: pending, error: error, decide: decide };
};
