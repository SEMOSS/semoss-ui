import type { EmailDraftEditor } from "@/features/connectors/api/email-draft-editor";
import { draftText, plainTextEmail } from "@/features/email/email-html";
import {
	readThreadCommand,
	type SubmittedThreadContext,
} from "@/features/thread-assistant/thread-context";
import {
	isReplyProposal,
	readDraftProposal,
} from "@/features/thread-assistant/thread-draft-proposal";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";

interface ReplyDraftAssistantSnapshot {
	isOpen: boolean;
	focusRequest: number;
	instructions: string;
	isRunning: boolean;
	isCancelling: boolean;
	error: string;
	notice: string;
	question: string;
	pendingBody: string | null;
}

interface DraftGeneration {
	session: ThreadSession;
	title: string;
	context: SubmittedThreadContext;
	/** Reads current exclusions even after the originating panel unmounts. */
	isSourceIncluded: () => boolean;
	/** The Work composer preserves unsent chat content through reconciliation. */
	submit: (operation: () => Promise<void>) => Promise<void>;
}

/** Retains one draft's AI interaction and observes completion independently of its view. */
export class ReplyDraftAssistant {
	private snapshot: ReplyDraftAssistantSnapshot = {
		isOpen: false,
		focusRequest: 0,
		instructions: "",
		isRunning: false,
		isCancelling: false,
		error: "",
		notice: "",
		question: "",
		pendingBody: null,
	};
	private listeners = new Set<() => void>();
	private cleanup: (() => void) | null = null;
	private stopRun: (() => Promise<void>) | null = null;
	private canApply: (() => boolean) | null = null;

	constructor(private readonly draft: EmailDraftEditor) {}
	getSnapshot = (): ReplyDraftAssistantSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<ReplyDraftAssistantSnapshot>): void {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	setOpen = (isOpen: boolean): void => {
		this.update({
			isOpen,
			focusRequest: this.snapshot.focusRequest + (isOpen ? 1 : 0),
		});
	};
	setInstructions = (instructions: string): void => {
		this.update({ instructions });
	};
	dismissSuggestion = (): void => {
		this.update({ pendingBody: null, notice: "" });
	};
	undoRevision = (): void => {
		if (
			this.draft.getSnapshot().undoBody === null ||
			this.draft.getSnapshot().isSaving
		)
			return;
		this.draft.undoRevision();
		this.update({ notice: "Revision undone." });
	};
	applySuggestion = (): void => {
		if (!this.canApply?.()) {
			this.update({
				error: "Include the original email in assistant context before applying this revision.",
			});
			return;
		}
		if (
			this.snapshot.pendingBody === null ||
			this.draft.getSnapshot().isSaving
		)
			return;
		this.draft.replaceBody(this.snapshot.pendingBody);
		this.update({
			pendingBody: null,
			error: "",
			notice: "Draft updated.",
		});
	};
	stop = async (): Promise<void> => {
		await this.stopRun?.();
	};

	/** Generation never writes to Outlook, changes recipients, or opens a workbench panel. */
	generate = async (
		options: DraftGeneration,
		instruction = this.snapshot.instructions,
	): Promise<void> => {
		if (this.snapshot.isRunning || this.draft.getSnapshot().isSaving)
			return;
		const source = this.draft.seed.sourceUid;
		if (!source || !options.isSourceIncluded()) {
			this.update({
				error: "Include the original email in assistant context before generating a draft.",
			});
			return;
		}
		const { session } = options;
		const initial = this.draft.getSnapshot();
		const requestId = crypto.randomUUID();
		const body = draftText(initial.values.body, "html", true);
		const instructions =
			instruction.trim() ||
			(body
				? "Improve clarity and concision while preserving the reply's meaning and facts. Return the revised draft."
				: "");
		const context: SubmittedThreadContext = {
			...options.context,
			selectedSourceMessageId: source,
			emailDraft: {
				draftId: this.draft.seed.id,
				requestId,
				body,
				bodyRevision: initial.bodyRevision,
			},
		};
		let isCancelled = false;
		let isFinished = false;
		let wasUnconfirmed = false;
		let hasObservedRequest = false;
		let hasStartedSubmission = false;
		const release = session.retain();
		this.canApply = options.isSourceIncluded;
		this.update({
			isRunning: true,
			isCancelling: false,
			error: "",
			notice: "",
			question: "",
			pendingBody: null,
		});
		const finish = (patch: Partial<ReplyDraftAssistantSnapshot>): void => {
			if (isFinished) return;
			isFinished = true;
			this.cleanup?.();
			this.cleanup = null;
			this.stopRun = null;
			this.update({ isRunning: false, isCancelling: false, ...patch });
		};
		const observe = (): void => {
			if (isFinished) return;
			const state = session.getSnapshot();
			const { turn } = state;
			const index = turn.messages.reduce(
				(last, message, position) =>
					message.role === "user" &&
					message.parts.some((part) => {
						const command =
							part.type === "text"
								? readThreadCommand(part.text)
								: null;
						return (
							command?.context.threadId === context.threadId &&
							command.context.emailDraft?.requestId === requestId
						);
					})
						? position
						: last,
				-1,
			);
			hasObservedRequest ||= index >= 0;
			if (turn.transportError || state.hasUnconfirmedSubmission) {
				wasUnconfirmed ||= state.hasUnconfirmedSubmission;
				this.update({
					error: "The request could not be confirmed. Check the connection before trying again.",
				});
				return;
			}
			if (
				wasUnconfirmed &&
				!state.isPreparing &&
				!turn.isRunning &&
				!turn.isSubmitting &&
				!turn.isRestoring &&
				index < 0
			) {
				finish({
					error: "The request was not found. You can try generating again.",
				});
				return;
			}
			if (
				turn.isRunning ||
				turn.isSubmitting ||
				turn.isRestoring ||
				!hasObservedRequest
			)
				return;
			if (isCancelled || turn.phase === "cancelled") {
				finish({
					notice: "Generation stopped. Your draft is unchanged.",
				});
				return;
			}
			if (turn.phase === "failed") {
				finish({
					error:
						turn.turnError ||
						"The draft could not be generated. Try again.",
				});
				return;
			}
			if (turn.phase !== "completed") return;
			if (index < 0) return;
			const nextUser = turn.messages.findIndex(
				(message, position) =>
					position > index && message.role === "user",
			);
			const responses = turn.messages
				.slice(index + 1, nextUser < 0 ? undefined : nextUser)
				.filter(
					(message) =>
						message.role === "assistant" &&
						message.visible !== false,
				);
			const proposals = responses.flatMap((message) => {
				const proposal = readDraftProposal(message);
				return proposal ? [proposal] : [];
			});
			const text = responses
				.flatMap((message) =>
					message.parts.flatMap((part) =>
						part.type === "text" ? [part.text] : [],
					),
				)
				.join("\n\n")
				.trim();
			const proposal = proposals.length === 1 ? proposals[0] : undefined;
			if (!proposal) {
				finish(
					text && !text.includes("```semoss-email-draft")
						? { question: text, error: "" }
						: {
								error: "The assistant returned an incomplete draft. Try again; your draft is unchanged.",
							},
				);
				return;
			}
			if (
				!isReplyProposal(proposal) ||
				proposal.sourceMessageId !== source ||
				!options.isSourceIncluded()
			) {
				finish({
					error: "This revision does not match the included original email. Your draft is unchanged.",
				});
				return;
			}
			const html = plainTextEmail(proposal.body);
			if (
				this.draft.getSnapshot().bodyRevision !==
					initial.bodyRevision ||
				this.draft.getSnapshot().isSaving
			) {
				finish({
					pendingBody: html,
					notice: "You edited the draft during generation. A revision is ready to review.",
					error: "",
				});
			} else {
				this.draft.replaceBody(html);
				finish({
					error: "",
					notice: "Draft updated.",
				});
			}
		};
		const unsubscribe = session.subscribe(observe);
		this.cleanup = () => {
			isFinished = true;
			unsubscribe();
			release();
		};
		this.stopRun = async () => {
			isCancelled = true;
			if (!hasStartedSubmission) {
				finish({
					notice: "Generation stopped. Your draft is unchanged.",
				});
				return;
			}
			this.update({ isCancelling: true });
			try {
				await session.cancel();
				observe();
			} catch {
				this.update({
					error: "Stopping could not be confirmed. Check the connection; this result will not replace your draft.",
				});
			}
		};
		try {
			await options.submit(async () => {
				await session.initialize();
				if (isFinished || isCancelled) return;
				if (!options.isSourceIncluded())
					throw new Error(
						"Include the original email in assistant context before generating a draft.",
					);
				const state = session.getSnapshot();
				if (state.error) throw state.error;
				if (state.hasUnconfirmedSubmission)
					throw new Error(
						"Check the last message before trying again.",
					);
				hasStartedSubmission = true;
				await session.send(options.title, context, {
					text: `${body ? "Revise the current email reply" : "Draft a reply to this email"} using the included thread context.${instructions ? `\n\n${instructions}` : ""}`,
					files: [],
				});
			});
			if (isCancelled && !isFinished) await this.stopRun?.();
			observe();
		} catch (cause) {
			if (isFinished) return;
			const error =
				cause instanceof Error
					? cause.message
					: "The draft could not be generated. Try again.";
			if (
				hasStartedSubmission &&
				session.getSnapshot().hasUnconfirmedSubmission
			)
				this.update({ error });
			else finish({ error });
		}
	};

	/** Release observers with the application scope; closing an editor does not dispose it. */
	dispose = (): void => {
		this.cleanup?.();
		this.cleanup = null;
		this.stopRun = null;
		this.listeners.clear();
	};
}
