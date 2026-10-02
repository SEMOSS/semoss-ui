import {
	EmailDraftEditor,
	type EmailDraftSeed,
} from "@/features/connectors/api/email-draft-editor";
import { draftText } from "@/features/email/email-html";
import type { ComposerDraft } from "@/features/rooms/components/room-composer.types";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { OutlookReplySession } from "./outlook-reply-session";
import { ReplyDraftAssistant } from "./reply-draft-assistant";
import type { ThreadComposerMode } from "./thread-composer-controls";

interface WorkComposerSnapshot {
	isPresentation: boolean;
	emailDrafts: EmailDraftEditor[];
	insightsRequest: { id: string; revision: string } | null;
	insightsError: string;
	referenceResults: { toolId: string; title: string; output: string }[];
	emailRequest: { id: string } | null;
	mode: ThreadComposerMode | null;
	draft: ComposerDraft;
	selected: string[];
	sourceMessageId?: string;
	revision: number;
	isSubmitting: boolean;
	error: string;
}

/** App-lifetime editor state; independent of the bounded cache of backend insights. */
export class WorkComposerSession {
	private snapshot: WorkComposerSnapshot = {
		isPresentation: false,
		emailDrafts: [],
		insightsRequest: null,
		insightsError: "",
		referenceResults: [],
		emailRequest: null,
		mode: null,
		draft: { document: null, text: "", files: [] },
		selected: [],
		revision: 0,
		isSubmitting: false,
		error: "",
	};
	private actionIds = new Set<string>();
	private preserveOnReconcile = false;
	private listeners = new Set<() => void>();
	private replies = new Map<string | undefined, OutlookReplySession>();
	private draftAssistants = new Map<string, ReplyDraftAssistant>();
	private activeReplyIds = new Map<string, string>();
	// the editor most recently shown, which the assistant can change
	private openDraftId: string | null = null;
	private includedSources = new Set<string>();
	private reconciled = new WeakMap<ThreadSession, number>();

	getSnapshot = (): WorkComposerSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<WorkComposerSnapshot>): void {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	selectReference = (reference: {
		toolId: string;
		title: string;
		output: string;
	}): void => {
		this.update({
			referenceResults: [
				...this.snapshot.referenceResults.filter(
					(item) => item.toolId !== reference.toolId,
				),
				reference,
			],
		});
	};
	removeReference = (toolId: string): void => {
		this.update({
			referenceResults: this.snapshot.referenceResults.filter(
				(item) => item.toolId !== toolId,
			),
		});
	};

	beginInsights = (request: { id: string; revision: string }): void => {
		this.update({ insightsRequest: request, insightsError: "" });
	};
	finishInsights = (error = ""): void => {
		this.update({ insightsRequest: null, insightsError: error });
	};

	setError = (error: string): void => {
		this.update({ error, mode: "assistant" });
	};
	setMode = (mode: ThreadComposerMode): void => {
		if (!this.snapshot.isSubmitting && this.snapshot.mode !== mode)
			this.update({ mode });
	};
	/** This destination applies only to the next successfully submitted request. */
	setPresentation = (isPresentation: boolean): void => {
		if (!this.snapshot.isSubmitting) this.update({ isPresentation });
	};
	setSourceMessage = (sourceMessageId?: string): void => {
		this.update({ sourceMessageId });
	};
	setSelected = (selected: string[]): void => {
		this.update({ selected });
	};
	/** Explicit draft actions resume their original document without touching assistant input. */
	requestEmailDraft = (
		seed: EmailDraftSeed,
		reveal = true,
	): EmailDraftEditor => {
		if (
			seed.mode === "reply" &&
			seed.sourceUid &&
			(reveal || !this.activeReplyIds.has(seed.sourceUid))
		)
			this.activeReplyIds.set(seed.sourceUid, seed.id);
		const existing = this.snapshot.emailDrafts.find(
			(draft) => draft.seed.id === seed.id,
		);
		const draft = existing ?? new EmailDraftEditor(seed);
		if (reveal) this.openDraftId = seed.id;
		this.update({
			emailDrafts: existing
				? this.snapshot.emailDrafts
				: [...this.snapshot.emailDrafts, draft],
			emailRequest: reveal ? { id: seed.id } : this.snapshot.emailRequest,
		});
		return draft;
	};
	/** The open, unsent email as it stands now, edits included, for the assistant to change. */
	openEmailContext = (): SubmittedThreadContext["openEmail"] => {
		const draft = this.snapshot.emailDrafts.find(
			(item) => item.seed.id === this.openDraftId,
		);
		const state = draft?.getSnapshot();
		if (!draft || !state) return undefined;
		// a sent email stays for the next turn, so the assistant knows it went out
		return {
			id: draft.seed.id,
			status: state.isSent
				? "sent"
				: state.sendApprovalToolId
					? "waiting"
					: state.saved && !state.isDirty
						? "saved"
						: "editing",
			...(draft.seed.mode === "reply" && draft.seed.sourceUid
				? { replyTo: draft.seed.sourceUid }
				: {}),
			...(draft.seed.mode === "forward" && draft.seed.sourceUid
				? { forward: draft.seed.sourceUid }
				: {}),
			to: state.values.to,
			cc: state.values.cc,
			subject: state.values.subject,
			body: draftText(state.values.body, "html", true),
			bodyRevision: state.bodyRevision,
		};
	};
	/** Show an email and press its Send; the editor form runs it, so validation stays there. */
	requestSend = (draft: EmailDraftEditor): void => {
		this.requestEmailDraft(draft.seed);
		draft.requestSubmit();
	};
	/** Track current context without storing source content on individual draft panels. */
	setIncludedSources = (sources: Set<string>): void => {
		this.includedSources = sources;
	};
	isSourceIncluded = (source: string): boolean =>
		this.includedSources.has(source);
	getDraftAssistant = (draft: EmailDraftEditor): ReplyDraftAssistant => {
		const existing = this.draftAssistants.get(draft.seed.id);
		if (existing) return existing;
		const assistant = new ReplyDraftAssistant(draft);
		this.draftAssistants.set(draft.seed.id, assistant);
		// The conversation owns generation feedback; the draft panel is email-only.
		assistant.subscribe(() => {
			const state = assistant.getSnapshot();
			if (state.error) this.setError(state.error);
			else if (state.pendingBody !== null)
				this.setError(
					"The draft changed during generation, so your edits were kept. Choose Draft reply to try again.",
				);
		});
		return assistant;
	};
	/** Manual and assisted entry points share the most recently opened reply for this source. */
	openReply = (
		sourceUid: string,
		subject: string,
		withAssistant: boolean,
	): EmailDraftEditor => {
		const current = this.snapshot.emailDrafts.find(
			(draft) => draft.seed.id === this.activeReplyIds.get(sourceUid),
		);
		const draft = this.requestEmailDraft(
			current?.seed ?? {
				id: `reply:${sourceUid}`,
				mode: "reply",
				sourceUid,
				subject,
			},
		);
		this.getDraftAssistant(draft).setOpen(withAssistant);
		return draft;
	};
	/** Consume a reveal request once; returning to the thread does not steal focus. */
	consumeEmailRequest = (request: { id: string }): void => {
		if (this.snapshot.emailRequest === request)
			this.update({ emailRequest: null });
	};
	/** Dispose attachment insights when the owning app session ends. */
	dispose = (): void => {
		for (const assistant of this.draftAssistants.values())
			assistant.dispose();
		for (const draft of this.snapshot.emailDrafts) draft.dispose();
	};
	setDraft = (revision: number, draft: ComposerDraft): void => {
		// A detached editor must never restore content cleared by a completed request.
		if (revision === this.snapshot.revision && !this.snapshot.isSubmitting)
			this.update({ draft });
	};
	getReply = (sourceUid?: string): OutlookReplySession => {
		let reply = this.replies.get(sourceUid);
		if (!reply) {
			reply = new OutlookReplySession(sourceUid);
			this.replies.set(sourceUid, reply);
		}
		return reply;
	};
	private clear(): void {
		this.update({
			isPresentation: false,
			draft: { document: null, text: "", files: [] },
			selected: [],
			sourceMessageId: undefined,
			revision: this.snapshot.revision + 1,
			error: "",
		});
	}
	/** Clear only when the existing chat reconciliation confirms a previously uncertain submit. */
	reconcile = (session: ThreadSession, resetKey: number): void => {
		const previous = this.reconciled.get(session) ?? 0;
		this.reconciled.set(session, resetKey);
		if (resetKey > previous) {
			if (this.preserveOnReconcile) this.preserveOnReconcile = false;
			else this.clear();
		}
	};
	/** Claim navigation requests once across route remounts. */
	claimAction = (id: string): boolean => {
		if (this.actionIds.has(id)) return false;
		this.actionIds.add(id);
		return true;
	};
	/** Quick requests do not consume the user's pending text or files. */
	async submitAction(operation: () => Promise<void>): Promise<void> {
		await this.submit(operation, true);
	}
	/** Keep content and errors here even when the initiating route unmounts. */
	async submit(
		operation: () => Promise<void>,
		preserveDraft = false,
	): Promise<void> {
		if (this.snapshot.isSubmitting)
			throw new Error("Your message is already being submitted.");
		this.preserveOnReconcile = preserveDraft;
		this.update({ isSubmitting: true, error: "" });
		try {
			await operation();
			if (!preserveDraft) this.clear();
		} catch (cause) {
			this.update({
				error:
					cause instanceof Error
						? cause.message
						: "Your message could not be submitted.",
			});
			throw cause;
		} finally {
			this.update({ isSubmitting: false });
		}
	}
}
