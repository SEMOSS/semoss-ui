import {
	saveEmailDraft,
	sendEmailDraft,
	UncertainDraftError,
	UncertainSendError,
} from "@/features/connectors/api/microsoft";
import type { SavedEmailDraft } from "@/features/connectors/types";
import type { InsightActions } from "@/lib/pixel";

interface ReplySnapshot {
	isSaving: boolean;
	isUncertain: boolean;
	isSent: boolean;
	uncertainAction: "save" | "send" | null;
	saved: SavedEmailDraft | null;
}

/** Owns an Outlook transaction independently of the editor's mounted lifetime. */
export class OutlookReplySession {
	private snapshot: ReplySnapshot = {
		isSaving: false,
		isUncertain: false,
		isSent: false,
		uncertainAction: null,
		saved: null,
	};
	private listeners = new Set<() => void>();
	private pending: {
		body: string;
		format: "text" | "html";
		receipt: SavedEmailDraft;
	} | null = null;

	constructor(private readonly sourceUid?: string) {}

	getSnapshot = (): ReplySnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<ReplySnapshot>): void {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	allowRetry = (): void => {
		this.update({ isUncertain: false, uncertainAction: null });
	};

	/** A send retry reuses the exact saved draft; uncertainty requires explicit review. */
	async submit(
		actions: InsightActions,
		body: string,
		format: "text" | "html",
		shouldSend: boolean,
	): Promise<void> {
		if (!this.sourceUid)
			throw new Error("Select an Outlook email to save a reply draft.");
		if (this.snapshot.isSaving)
			throw new Error("Your reply is already being submitted.");
		if (this.snapshot.isUncertain)
			throw new Error("Check Outlook before submitting another copy.");
		if (
			this.pending &&
			(!shouldSend ||
				this.pending.body !== body ||
				this.pending.format !== format)
		)
			throw new Error(
				"A reply draft was already created. Restore the original reply before retrying, or open the saved draft in Outlook to finish it.",
			);
		this.update({ isSaving: true, isSent: false });
		let stage: "save" | "send" = "save";
		try {
			let receipt = this.pending?.receipt;
			if (!receipt) {
				receipt = await saveEmailDraft(actions, {
					mode: "reply",
					sourceUid: this.sourceUid,
					body,
					...(format === "html" ? { bodyFormat: format } : {}),
					replyAll: false,
				});
				if (shouldSend) this.pending = { body, format, receipt };
			}
			this.update({ saved: receipt });
			if (shouldSend) {
				stage = "send";
				await sendEmailDraft(actions, receipt.savedDraftId);
				this.pending = null;
				this.update({ isSent: true, saved: null });
			}
		} catch (cause) {
			this.update({
				isUncertain:
					cause instanceof UncertainDraftError ||
					cause instanceof UncertainSendError,
				uncertainAction: stage,
			});
			throw cause;
		} finally {
			this.update({ isSaving: false });
		}
	}
}
