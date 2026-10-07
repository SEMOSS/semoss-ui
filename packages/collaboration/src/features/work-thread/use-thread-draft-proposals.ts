import { useEffect, useRef, useState } from "react";
import type { Thread } from "@/features/collaboration/state/collaboration.types";
import type { AgentEmailAttachment } from "@/features/connectors/api/agent-email-attachments";
import { plainTextEmail } from "@/features/email/email-html";
import {
	readThreadCommand,
	type SubmittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import {
	composeDraftId,
	isReplyProposal,
	isSourcedProposal,
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
	loadAttachment,
}: {
	thread: Thread;
	composer: WorkComposerSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
	allowedSources: Set<string>;
	isReady: boolean;
	loadAttachment?: (file: AgentEmailAttachment) => Promise<File>;
}): string {
	const observedRun = useRef(false);
	// revisions already applied to an open editor, so a re-render never applies one twice
	const appliedRevisions = useRef(new Set<string>());
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
		let lastUserIndex = snapshot.turn.messages.reduce(
			(last, message, index) => (message.role === "user" ? index : last),
			-1,
		);
		const isUnfinished =
			isRunning ||
			snapshot.turn.phase === "cancelled" ||
			snapshot.turn.phase === "failed";
		const completedMessages = isUnfinished
			? snapshot.turn.messages.slice(0, Math.max(0, lastUserIndex))
			: snapshot.turn.messages;
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
		lastUserIndex = messages.reduce(
			(last, message, index) => (message.role === "user" ? index : last),
			-1,
		);
		let latestId: string | undefined;
		let selectedSource: string | undefined;
		let editorRequest: SubmittedThreadContext["emailDraft"];
		let openEmail: SubmittedThreadContext["openEmail"];
		const restoredEditors = new Map<
			string,
			{ source: string; body: string }
		>();
		for (const [index, message] of messages.entries()) {
			if (message.role === "user") {
				selectedSource = undefined;
				editorRequest = undefined;
				openEmail = undefined;
				for (const part of message.parts) {
					const command =
						part.type === "text"
							? readThreadCommand(part.text)
							: null;
					if (command?.context.threadId === thread.id) {
						selectedSource =
							command.context.selectedSourceMessageId;
						editorRequest = command.context.emailDraft;
						openEmail = command.context.openEmail;
					}
				}
			}
			const proposal = readDraftProposal(message);
			// A retained editor session owns live revisions, errors and cancellation.
			// History may restore its latest complete body, but never overwrite local edits.
			if (editorRequest) {
				if (
					proposal?.body &&
					isReplyProposal(proposal) &&
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
				if (!appliedRevisions.current.has(id)) {
					appliedRevisions.current.add(id);
					const isLatest = reveal && index > lastUserIndex;
					const state = target.getSnapshot();
					if (
						isLatest &&
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
							to: proposal.to || state.values.to,
							cc: proposal.cc ?? state.values.cc,
							bcc: isReply
								? state.values.bcc
								: (proposal.bcc ?? state.values.bcc),
							subject: isReply
								? state.values.subject
								: proposal.subject || state.values.subject,
						});
						if (proposal.body)
							target.replaceBody(plainTextEmail(proposal.body));
					}
				}
				if (index > lastUserIndex) latestId = target.seed.id;
				continue;
			}
			// a change to an editor that is gone has nothing to open
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
				if (index > lastUserIndex) latestId = id;
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
	useEffect(() => {
		if (!isReady) return;
		const isRunning = snapshot.turn.isRunning || snapshot.turn.isSubmitting;
		const lastUser = snapshot.turn.messages.reduce(
			(last, message, index) => (message.role === "user" ? index : last),
			-1,
		);
		const unfinished =
			isRunning ||
			snapshot.turn.phase === "cancelled" ||
			snapshot.turn.phase === "failed";
		const messages = unfinished
			? snapshot.turn.messages.slice(0, Math.max(0, lastUser))
			: snapshot.turn.messages;
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
									"Reopen this thread to load its email attachments.",
								),
							)),
					proposal.attachmentError,
				);
			}
		}
	}, [composer, isReady, loadAttachment, snapshot.turn]);
	return error;
}
