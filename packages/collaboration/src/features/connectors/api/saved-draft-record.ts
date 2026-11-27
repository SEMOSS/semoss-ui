import type { SavedEmailDraft } from "../types";

const PREFIX = "collaboration:saved-email-draft:";

/** A file Outlook already holds on a draft that was saved earlier. */
export interface SavedDraftAttachment {
	id: string;
	name: string;
	size?: number;
}

function store(): Storage | null {
	try {
		return typeof window === "undefined" ? null : window.sessionStorage;
	} catch {
		return null;
	}
}

/** Remember which Outlook draft an editor was saved as, so a reload can find it again. */
export function rememberSavedDraft(
	editorId: string,
	saved: SavedEmailDraft,
): void {
	try {
		store()?.setItem(PREFIX + editorId, JSON.stringify(saved));
	} catch {
		// storage can be full or blocked; the editor still works without it
	}
}

/** The Outlook draft this editor was saved as earlier, if the browser kept it. */
export function recallSavedDraft(editorId: string): SavedEmailDraft | null {
	try {
		const raw = store()?.getItem(PREFIX + editorId);
		if (!raw) return null;
		const value: unknown = JSON.parse(raw);
		if (
			typeof value === "object" &&
			value !== null &&
			"savedDraftId" in value &&
			typeof value.savedDraftId === "string" &&
			value.savedDraftId
		)
			return value as SavedEmailDraft;
	} catch {
		// an unreadable record is the same as none
	}
	return null;
}

export function forgetSavedDraft(editorId: string): void {
	try {
		store()?.removeItem(PREFIX + editorId);
	} catch {
		// nothing to clear
	}
}
