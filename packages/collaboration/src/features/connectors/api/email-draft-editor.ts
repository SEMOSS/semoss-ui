import { draftText, plainTextEmail } from "@/features/email/email-html";
import type { InsightActions } from "@/lib/pixel";
import type { EmailDraftInput, SavedEmailDraft } from "../types";
import { EmailDraftSession } from "./email-draft-session";
import { type EmailDraftValues, emailDraftSchema } from "./email-draft-values";
import { saveEmailDraft, UncertainDraftError } from "./microsoft";

export interface EmailDraftSeed {
	/** Stable origin identity; reopening an origin never replaces local edits. */
	id: string;
	/** Assistant proposals require explicit acceptance before the first save. */
	assistantMessageId?: string;
	/** Editor-targeted proposals live in the local draft tray, rather than a chat card. */
	requiresAcceptance?: boolean;
	mode: EmailDraftInput["mode"];
	sourceUid?: string;
	body?: string;
	subject?: string;
	to?: string;
	cc?: string;
	bcc?: string;
}

export type EmailDraftFieldErrors = Partial<
	Record<keyof EmailDraftValues, string>
>;

interface EmailDraftSnapshot {
	values: EmailDraftValues;
	fieldErrors: EmailDraftFieldErrors;
	saved: SavedEmailDraft | null;
	isSaving: boolean;
	isUncertain: boolean;
	isDirty: boolean;
	/** Monotonic body revision protects edits made while generation is running. */
	bodyRevision: number;
	bodyReplacement: number;
	undoBody: string | null;
	requiresAcceptance: boolean;
	error: string;
}

/** Compare envelope fields, rich body and attachment identity against a saved copy. */
function sameDraftValues(a: EmailDraftValues, b: EmailDraftValues): boolean {
	return (
		a.to === b.to &&
		a.cc === b.cc &&
		a.bcc === b.bcc &&
		a.subject === b.subject &&
		a.body === b.body &&
		a.replyAll === b.replyAll &&
		a.files.length === b.files.length &&
		a.files.every(
			(file, index) =>
				file.id === b.files[index]?.id &&
				file.file === b.files[index]?.file,
		)
	);
}

/** Owns an editable email and its transaction across panel and route lifetimes. */
export class EmailDraftEditor {
	private snapshot: EmailDraftSnapshot;
	private listeners = new Set<() => void>();
	private uploads: EmailDraftSession | null = null;
	private savedValues: EmailDraftValues | null = null;

	constructor(readonly seed: EmailDraftSeed) {
		this.snapshot = {
			values: {
				to: seed.to ?? "",
				cc: seed.cc ?? "",
				bcc: seed.bcc ?? "",
				subject: seed.subject ?? "",
				body: plainTextEmail(seed.body ?? ""),
				replyAll: false,
				files: [],
			},
			fieldErrors: {},
			saved: null,
			isSaving: false,
			isUncertain: false,
			isDirty: false,
			bodyRevision: 0,
			bodyReplacement: 0,
			undoBody: null,
			requiresAcceptance: Boolean(
				seed.assistantMessageId || seed.requiresAcceptance,
			),
			error: "",
		};
	}

	getSnapshot = (): EmailDraftSnapshot => this.snapshot;
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	private update(patch: Partial<EmailDraftSnapshot>): void {
		this.snapshot = { ...this.snapshot, ...patch };
		for (const listener of this.listeners) listener();
	}
	setFieldErrors = (fieldErrors: EmailDraftFieldErrors): void => {
		const fields = Object.keys(
			this.snapshot.values,
		) as (keyof EmailDraftValues)[];
		if (
			fields.some(
				(field) =>
					fieldErrors[field] !== this.snapshot.fieldErrors[field],
			)
		)
			this.update({ fieldErrors });
	};
	setValues = (values: EmailDraftValues): void => {
		const current = this.snapshot.values;
		const hasChanges = !sameDraftValues(values, current);
		if (!this.snapshot.isSaving && hasChanges)
			this.update({
				values,
				isDirty:
					!this.savedValues ||
					!sameDraftValues(values, this.savedValues),
				...(values.body !== current.body
					? {
							bodyRevision: this.snapshot.bodyRevision + 1,
							undoBody: null,
						}
					: {}),
			});
	};
	/** Replace only the body, preserving envelope fields and the exact formatted undo value. */
	replaceBody = (body: string): void => {
		if (this.snapshot.isSaving) return;
		const values = { ...this.snapshot.values, body };
		this.update({
			values,
			undoBody: this.snapshot.values.body,
			bodyRevision: this.snapshot.bodyRevision + 1,
			bodyReplacement: this.snapshot.bodyReplacement + 1,
			requiresAcceptance: true,
			isDirty:
				!this.savedValues || !sameDraftValues(values, this.savedValues),
			fieldErrors: { ...this.snapshot.fieldErrors, body: undefined },
		});
	};
	/** Manual typing dismisses this shortcut; ordinary editor undo remains available. */
	undoRevision = (): void => {
		const body = this.snapshot.undoBody;
		if (body === null || this.snapshot.isSaving) return;
		this.replaceBody(body);
		this.update({ undoBody: null });
	};
	allowRetry = (): void => {
		this.update({ isUncertain: false, error: "" });
	};

	/** Save a new Outlook copy only on explicit submission; never send email. */
	async save(
		actions: InsightActions,
		values: EmailDraftValues,
	): Promise<SavedEmailDraft | null> {
		if (this.snapshot.isSaving || this.snapshot.isUncertain) return null;
		if (this.savedValues && sameDraftValues(values, this.savedValues))
			return null;
		const { mode, sourceUid } = this.seed;
		const parsed = emailDraftSchema.safeParse(values);
		if (!parsed.success) {
			this.update({
				error:
					parsed.error.issues[0]?.message ??
					"Review the draft fields.",
			});
			return null;
		}
		if (mode !== "new" && !sourceUid) {
			this.update({
				error: "Select the source email before creating this draft.",
			});
			return null;
		}
		if (mode === "reply" && !draftText(values.body, "html")) {
			this.update({ error: "Enter reply text." });
			return null;
		}
		if (mode === "forward" && !values.to.trim()) {
			this.update({ error: "Enter at least one recipient." });
			return null;
		}
		const input: EmailDraftInput =
			mode === "new"
				? {
						mode,
						to: values.to,
						cc: values.cc,
						bcc: values.bcc,
						subject: values.subject,
						body: values.body,
						bodyFormat: "html",
					}
				: mode === "reply"
					? {
							mode,
							sourceUid: sourceUid ?? "",
							body: values.body,
							bodyFormat: "html",
							replyAll: values.replyAll,
						}
					: {
							mode,
							sourceUid: sourceUid ?? "",
							to: values.to,
							body: values.body,
							bodyFormat: "html",
						};
		this.update({ values, isSaving: true, error: "" });
		try {
			let saved: SavedEmailDraft;
			if (input.mode === "new" && values.files.length) {
				this.uploads ??= new EmailDraftSession();
				saved = await this.uploads.save(
					input,
					values.files.map(({ file }) => file),
				);
			} else saved = await saveEmailDraft(actions, input);
			this.savedValues = { ...values, files: [...values.files] };
			this.update({ saved, isDirty: false });
			return saved;
		} catch (cause) {
			this.update({
				error:
					cause instanceof Error
						? cause.message
						: "The draft could not be saved.",
				isUncertain: cause instanceof UncertainDraftError,
			});
			return null;
		} finally {
			this.update({ isSaving: false });
		}
	}

	/** Release isolated file resources at the owning application boundary. */
	dispose(): void {
		this.uploads?.dispose();
		this.uploads = null;
	}
}

/** Human-readable status for retained draft summaries. */
export function emailDraftStatus(snapshot: EmailDraftSnapshot): string {
	if (snapshot.isSaving) return "Saving";
	if (
		snapshot.error ||
		snapshot.isUncertain ||
		Object.keys(snapshot.fieldErrors).length
	)
		return "Needs attention";
	if (snapshot.saved)
		return snapshot.isDirty
			? "Local changes · saved copy in Outlook"
			: "Saved to Outlook";
	return "Not saved to Outlook";
}
