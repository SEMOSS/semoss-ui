import { useEffect, useRef, useState } from "react";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import {
	readThreadCommand,
	type SubmittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import {
	draftProposalId,
	readDraftProposal,
} from "@/features/thread-assistant/thread-draft-proposal";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import type { WorkComposerSession } from "./work-composer-session";

/** Hydrate proposals without opening history; only a run observed here can reveal a new draft. */
export function useThreadDraftProposals({
	thread,
	composer,
	snapshot,
	allowedSources,
	isReady,
}: {
	thread: Thread;
	composer: WorkComposerSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	allowedSources: Set<string>;
	isReady: boolean;
}): string {
	const observedRun = useRef(false);
	const baseline = useRef<number | null>(null);
	const [error, setError] = useState("");
	useEffect(() => {
		if (!isReady) return;
		if (baseline.current === null)
			baseline.current = snapshot.turn.settlementVersion;
		if (snapshot.turn.isRunning || snapshot.turn.isSubmitting) {
			observedRun.current = true;
			setError("");
		}
		const isRunning = snapshot.turn.isRunning || snapshot.turn.isSubmitting;
		const reveal =
			!isRunning &&
			observedRun.current &&
			snapshot.turn.phase === "completed" &&
			snapshot.turn.settlementVersion > baseline.current;
		baseline.current = snapshot.turn.settlementVersion;
		if (!isRunning) observedRun.current = false;
		// Durable output can arrive before the run settles. Wait for completion before
		// creating this turn's editor, and never hydrate partial failed/cancelled output.
		const lastUserIndex = snapshot.turn.messages.reduce(
			(last, message, index) => (message.role === "user" ? index : last),
			-1,
		);
		const isUnfinished =
			isRunning ||
			snapshot.turn.phase === "cancelled" ||
			snapshot.turn.phase === "failed";
		const messages = isUnfinished
			? snapshot.turn.messages.slice(0, Math.max(0, lastUserIndex))
			: snapshot.turn.messages;
		let latestId: string | undefined;
		let selectedSource: string | undefined;
		let editorRequest: SubmittedThreadContext["emailDraft"];
		const restoredEditors = new Map<
			string,
			{ source: string; body: string }
		>();
		for (const [index, message] of messages.entries()) {
			if (message.role === "user") {
				selectedSource = undefined;
				editorRequest = undefined;
				for (const part of message.parts) {
					const command =
						part.type === "text"
							? readThreadCommand(part.text)
							: null;
					if (command?.context.threadId === thread.id) {
						selectedSource =
							command.context.selectedSourceMessageId;
						editorRequest = command.context.emailDraft;
					}
				}
			}
			const proposal = readDraftProposal(message);
			// A retained editor session owns live revisions, errors and cancellation.
			// History may restore its latest complete body, but never overwrite local edits.
			if (editorRequest) {
				if (
					proposal &&
					thread.source?.kind === "outlook" &&
					proposal.sourceMessageId === selectedSource &&
					allowedSources.has(proposal.sourceMessageId)
				)
					restoredEditors.set(editorRequest.draftId, {
						source: proposal.sourceMessageId,
						body: proposal.body,
					});
				continue;
			}
			if (!proposal) {
				if (
					reveal &&
					index > lastUserIndex &&
					message.role === "assistant" &&
					message.parts.some(
						(part) =>
							part.type === "text" &&
							part.text.includes("```semoss-email-draft"),
					)
				)
					setError(
						"The assistant returned an incomplete draft. Ask it to try again; nothing was saved.",
					);
				continue;
			}
			if (
				thread.source?.kind !== "outlook" ||
				!allowedSources.has(proposal.sourceMessageId) ||
				(selectedSource !== undefined &&
					proposal.sourceMessageId !== selectedSource)
			) {
				if (reveal && index > lastUserIndex)
					setError(
						"This draft does not match the selected, included email. Ask the assistant to try again; nothing was saved.",
					);
				continue;
			}
			const id = draftProposalId(message);
			if (
				composer
					.getSnapshot()
					.emailDrafts.some((draft) => draft.seed.id === id)
			)
				continue;
			composer.requestEmailDraft(
				{
					id,
					assistantMessageId: message.runId || message.id,
					mode: "reply",
					sourceUid: proposal.sourceMessageId,
					subject: thread.subject,
					body: proposal.body,
				},
				false,
			);
			if (index > lastUserIndex) latestId = id;
		}
		for (const [id, proposal] of restoredEditors) {
			if (
				!composer
					.getSnapshot()
					.emailDrafts.some((draft) => draft.seed.id === id)
			) {
				composer.requestEmailDraft(
					{
						id,
						mode: "reply",
						sourceUid: proposal.source,
						subject: thread.subject,
						body: proposal.body,
						requiresAcceptance: true,
					},
					false,
				);
			}
		}
		if (reveal && latestId) {
			const draft = composer
				.getSnapshot()
				.emailDrafts.find((item) => item.seed.id === latestId);
			if (draft) composer.requestEmailDraft(draft.seed);
		}
	}, [allowedSources, composer, isReady, snapshot.turn, thread]);
	return error;
}
