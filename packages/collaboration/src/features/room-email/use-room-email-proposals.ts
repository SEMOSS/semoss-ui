import { useEffect, useRef, useState } from "react";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import type { AgentEmailAttachment } from "@/features/connectors/api/agent-email-attachments";
import { plainTextEmail } from "@/features/email/email-html";
import type { ConversationMessage } from "@/features/messages/types/message";
import { toolsFromMessages } from "@/features/messages/utils/thread-items";
import type { EmailEditorStore } from "@/features/room-email/room-email-store";
import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";
import {
	readThreadCommand,
	type SubmittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import {
	composeDraftId,
	isSourcedProposal,
	readDraftProposal,
} from "@/features/thread-assistant/thread-draft-proposal";
import { getEditorSendId } from "./room-email-tools";

/** A paused send may review only completed compose calls for the editor it names. */
function readyEmailMessages(turn: AgentTurnSnapshot): ConversationMessage[] {
	const unfinished =
		turn.isRunning ||
		turn.isSubmitting ||
		turn.phase === "cancelled" ||
		turn.phase === "failed";
	if (!unfinished) return turn.messages;
	const lastUser = turn.messages.reduce(
		(last, message, index) => (message.role === "user" ? index : last),
		-1,
	);
	const history = turn.messages.slice(0, Math.max(0, lastUser));
	if (turn.phase !== "awaiting_approval") return history;
	const tools = toolsFromMessages(
		turn.messages,
		turn.pendingApprovals,
		turn.toolStates,
	);
	const pendingDrafts = new Set(
		turn.pendingApprovals.flatMap((approval) => {
			const id = getEditorSendId(tools[approval.toolId], approval);
			return id ? [id] : [];
		}),
	);
	if (!pendingDrafts.size) return history;
	return [
		...history,
		...turn.messages.slice(Math.max(0, lastUser)).flatMap((message) => {
			if (message.role === "user") return [message];
			const parts = message.parts.filter((part) => {
				// The tool itself must be complete; the owning run is paused for this send.
				const proposal = readDraftProposal({
					...message,
					runStatus: undefined,
					live: undefined,
					parts: [part],
				});
				return (
					proposal &&
					pendingDrafts.has(
						proposal.openEmailId || composeDraftId(proposal.toolId),
					)
				);
			});
			return parts.length
				? [{ ...message, parts, runStatus: undefined, live: undefined }]
				: [];
		}),
	];
}

/** Restore completed email tools into retained editors without opening any panels. */
export function useRoomEmailProposals({
	thread,
	composer,
	snapshot,
	allowedSources,
	isReady,
	loadAttachment,
}: {
	thread: Pick<Thread, "id" | "subject" | "source">;
	composer: EmailEditorStore;
	snapshot: { turn: AgentTurnSnapshot };
	allowedSources: Set<string>;
	isReady: boolean;
	loadAttachment?: (file: AgentEmailAttachment) => Promise<File>;
}): string {
	const observedRun = useRef(false);
	const baseline = useRef<number | null>(null);
	const [error, setError] = useState("");
	useEffect(() => {
		if (!isReady) return;
		// A retained room may have finished its run while its UI was unmounted.
		// Editors already present here still own local edits from before navigation.
		const retainedDrafts = new Set(
			composer.getSnapshot().emailDrafts.map((draft) => draft.seed.id),
		);
		if (baseline.current === null)
			baseline.current = snapshot.turn.settlementVersion;
		if (snapshot.turn.isRunning || snapshot.turn.isSubmitting) {
			observedRun.current = true;
			setError("");
		}
		const isRunning = snapshot.turn.isRunning || snapshot.turn.isSubmitting;
		const isNewCompletion =
			!isRunning &&
			observedRun.current &&
			snapshot.turn.phase === "completed" &&
			snapshot.turn.settlementVersion > baseline.current;
		baseline.current = snapshot.turn.settlementVersion;
		if (!isRunning) observedRun.current = false;
		// Ordinary generation waits for settlement; a paused send must review its
		// completed compose output before approving the editor's saved draft.
		const completedMessages = readyEmailMessages(snapshot.turn);
		const messages = completedMessages.flatMap((message) => {
			if (message.role !== "assistant") return [message];
			const calls = message.parts.filter(
				(part) =>
					part.type === "tool" && part.tool.name === "ComposeEmail",
			);
			return calls.length
				? calls.map((part) => ({ ...message, parts: [part] }))
				: [message];
		});
		const lastUserIndex = messages.reduce(
			(last, message, index) => (message.role === "user" ? index : last),
			-1,
		);
		let selectedSource: string | undefined;
		let openEmail: SubmittedThreadContext["openEmail"];
		for (const [index, message] of messages.entries()) {
			if (message.role === "user") {
				selectedSource = undefined;
				openEmail = undefined;
				for (const part of message.parts) {
					const command =
						part.type === "text"
							? readThreadCommand(part.text)
							: null;
					if (command?.context.threadId === thread.id) {
						selectedSource =
							command.context.selectedSourceMessageId;
						openEmail = command.context.openEmail;
					}
				}
			}
			const proposal = readDraftProposal(message);
			if (!proposal) continue;
			const id = composeDraftId(proposal.toolId);
			// a change to the email the owner has open updates that editor in place
			const target = proposal.openEmailId
				? composer
						.getSnapshot()
						.emailDrafts.find(
							(draft) => draft.seed.id === proposal.openEmailId,
						)
				: undefined;
			if (target) {
				if (composer.claimProposalRevision(id)) {
					const state = target.getSnapshot();
					if (
						retainedDrafts.has(target.seed.id) &&
						proposal.body &&
						openEmail?.id === target.seed.id &&
						state.bodyRevision !== openEmail.bodyRevision
					) {
						setError(
							"You edited the email while the assistant was writing, so your edits were kept. Ask again to apply the change.",
						);
					} else {
						// a reply or forward keeps its thread's subject and has no bcc
						const isReply = isSourcedProposal(proposal);
						target.replaceEnvelope({
							to: proposal.to ?? state.values.to,
							cc: proposal.cc ?? state.values.cc,
							bcc: isReply
								? state.values.bcc
								: (proposal.bcc ?? state.values.bcc),
							subject: isReply
								? state.values.subject
								: (proposal.subject ?? state.values.subject),
						});
						if (proposal.body)
							target.replaceBody(plainTextEmail(proposal.body));
					}
				}
				continue;
			}
			// a change to an editor that is gone has nothing to open
			if (proposal.openEmailId) continue;
			const isForward =
				isSourcedProposal(proposal) && proposal.mode === "forward";
			if (!proposal.body && !isForward) continue;
			const isOpen = composer
				.getSnapshot()
				.emailDrafts.some((draft) => draft.seed.id === id);
			// a new email needs no source, so any thread or session can open one
			if (!isSourcedProposal(proposal)) {
				if (!isOpen)
					composer.requestEmailDraft(
						{
							id,
							assistantMessageId: message.runId || message.id,
							mode: "new",
							to: proposal.to,
							cc: proposal.cc ?? "",
							bcc: proposal.bcc ?? "",
							subject: proposal.subject,
							body: proposal.body,
						},
						false,
					);
				continue;
			}
			if (
				thread.source?.kind !== "outlook" ||
				!allowedSources.has(proposal.sourceMessageId) ||
				(selectedSource !== undefined &&
					proposal.sourceMessageId !== selectedSource)
			) {
				if (isNewCompletion && index > lastUserIndex)
					setError(
						"This draft does not match the selected, included email. Ask the assistant to try again; nothing was saved.",
					);
				continue;
			}
			if (isOpen) continue;
			composer.requestEmailDraft(
				{
					id,
					assistantMessageId: message.runId || message.id,
					mode: proposal.mode,
					sourceUid: proposal.sourceMessageId,
					subject: thread.subject,
					body: proposal.body ?? "",
					to: proposal.to,
					cc: proposal.cc,
				},
				false,
			);
		}
	}, [allowedSources, composer, isReady, snapshot.turn, thread]);
	useEffect(() => {
		if (!isReady) return;
		const messages = readyEmailMessages(snapshot.turn);
		for (const message of messages) {
			for (const part of message.parts) {
				const proposal = readDraftProposal({
					...message,
					parts: [part],
				});
				if (
					!proposal ||
					(!proposal.attachments?.length && !proposal.attachmentError)
				)
					continue;
				const id =
					proposal.openEmailId || composeDraftId(proposal.toolId);
				const target = composer
					.getSnapshot()
					.emailDrafts.find((draft) => draft.seed.id === id);
				if (!target) {
					setError(
						"The email for these attachments is no longer open. Ask the assistant to attach them to the current email.",
					);
					continue;
				}
				void target.addAgentAttachments(
					proposal.toolId,
					proposal.attachments ?? [],
					loadAttachment ??
						(() =>
							Promise.reject(
								new Error(
									"Reopen this room to load its email attachments.",
								),
							)),
					proposal.attachmentError,
				);
			}
		}
	}, [composer, isReady, loadAttachment, snapshot.turn]);
	return error;
}
