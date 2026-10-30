import { useCallback } from "react";
import { useInsight } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";
import type { StyleDraft } from "../components/style-form-values";
import type { ProfileStyle } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { saveStyleNow } from "./style-api";

/** What an explicit save sends: the whole style, so the server never has to guess what changed. */
export interface StyleSaveRequest extends StyleDraft {
	source: ProfileStyle["source"];
	confirmed: boolean;
	/** Also clears the proposal the owner has just reviewed. */
	clearProposal?: boolean;
}

/**
 * Saves the writing style straight to the server and waits for it, so the owner sees whether it worked.
 * On success the session takes the style the server returned, not the one that was sent. Rejects with the
 * server's message when the save fails, leaving the session and the owner's entries unchanged.
 */
export function useStyleSave(): (
	request: StyleSaveRequest,
	successMessage: string,
) => Promise<void> {
	const { actions } = useInsight();
	const { dispatch } = useCollaborationSession();
	return useCallback(
		async (request, successMessage) => {
			const style = await saveStyleNow(actions, {
				summary: request.summary,
				source: request.source,
				confirmed: request.confirmed,
				examples: request.examples,
				variants: request.variants,
				...(request.clearProposal ? { pending: null } : {}),
			});
			dispatch({ type: "profile.style.server", style });
			toast.success(successMessage);
		},
		[actions, dispatch],
	);
}
