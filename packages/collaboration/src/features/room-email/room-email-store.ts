import {
	EmailDraftEditor,
	type EmailDraftSeed,
} from "@/features/connectors/api/email-draft-editor";
import { draftText } from "@/features/email/email-html";
import type { SubmittedThreadContext } from "@/features/thread-assistant/thread-context";

/** The email-only state consumed by readers, tool cards and approval bindings. */
export interface EmailEditorStore {
	subscribe: (listener: () => void) => () => void;
	getSnapshot: () => { emailDrafts: EmailDraftEditor[] };
	requestEmailDraft: (
		seed: EmailDraftSeed,
		activate?: boolean,
	) => EmailDraftEditor;
	/** Claim a completed revision across panel and route remounts. */
	claimProposalRevision: (id: string) => boolean;
}

/** Retain email edits with their owning room, independently of dock visibility. */
export class RoomEmailStore implements EmailEditorStore {
	private snapshot: { emailDrafts: EmailDraftEditor[] } = { emailDrafts: [] };
	private listeners = new Set<() => void>();
	private openDraftId: string | null = null;
	private selectedSourceMessageId: string | undefined;
	private appliedRevisions = new Set<string>();

	getSnapshot = (): { emailDrafts: EmailDraftEditor[] } => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	};
	claimProposalRevision = (id: string): boolean => {
		if (this.appliedRevisions.has(id)) return false;
		this.appliedRevisions.add(id);
		return true;
	};
	/** Track the displayed source for the next room message without copying its body. */
	selectSourceMessage = (messageId: string | undefined): void => {
		this.selectedSourceMessageId = messageId;
	};
	getSelectedSourceMessage = (): string | undefined =>
		this.selectedSourceMessageId;

	/** Existing identities resume their edited values without reseeding. */
	requestEmailDraft = (
		seed: EmailDraftSeed,
		activate = true,
	): EmailDraftEditor => {
		const existing = this.snapshot.emailDrafts.find(
			(draft) => draft.seed.id === seed.id,
		);
		if (activate) this.openDraftId = seed.id;
		if (existing) return existing;
		const draft = new EmailDraftEditor(seed);
		this.snapshot = {
			emailDrafts: [...this.snapshot.emailDrafts, draft],
		};
		for (const listener of this.listeners) listener();
		return draft;
	};

	/** Read at submission time so the assistant receives the owner's latest edits. */
	openEmailContext = (): SubmittedThreadContext["openEmail"] => {
		const draft = this.snapshot.emailDrafts.find(
			(item) => item.seed.id === this.openDraftId,
		);
		if (!draft) return undefined;
		const state = draft.getSnapshot();
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
			...(state.values.files.length
				? {
						attachments: state.values.files.map(({ file }) => ({
							name: file.name,
							size: file.size,
						})),
					}
				: {}),
		};
	};

	/** Release attachment resources when the owning room is disposed. */
	dispose = (): void => {
		for (const draft of this.snapshot.emailDrafts) draft.dispose();
		this.listeners.clear();
	};
}

const editors = new WeakMap<object, RoomEmailStore>();

/** The retained room object is the owner; no source-thread session is allocated. */
export function getRoomEmailStore(session: object): RoomEmailStore {
	let store = editors.get(session);
	if (!store) {
		store = new RoomEmailStore();
		editors.set(session, store);
	}
	return store;
}

/** Current reader and editor identities supplement the room's source-file context. */
export function getRoomEmailContext(
	session: object,
):
	| Pick<SubmittedThreadContext, "openEmail" | "selectedSourceMessageId">
	| undefined {
	const store = editors.get(session);
	const openEmail = store?.openEmailContext();
	const selectedSourceMessageId = store?.getSelectedSourceMessage();
	return openEmail || selectedSourceMessageId
		? {
				...(openEmail ? { openEmail } : {}),
				...(selectedSourceMessageId ? { selectedSourceMessageId } : {}),
			}
		: undefined;
}

/** End retained editor resources with the room instead of a React panel mount. */
export function disposeRoomEmailStore(session: object): void {
	editors.get(session)?.dispose();
	editors.delete(session);
}

/** Never discard local edits or an unresolved mailbox write during room eviction. */
export function canEvictRoomEmailStore(session: object): boolean {
	return (
		editors
			.get(session)
			?.getSnapshot()
			.emailDrafts.every((draft) => {
				const state = draft.getSnapshot();
				return (
					Boolean(draft.seed.assistantMessageId) &&
					!state.isDirty &&
					!state.isSaving &&
					!state.isSending &&
					!state.isUncertain &&
					!state.hasPendingSend &&
					!state.sendApprovalToolId &&
					!state.isSubmitRequested &&
					state.pendingAttachments === 0
				);
			}) ?? true
	);
}
