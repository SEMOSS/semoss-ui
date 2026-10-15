import type { SerializedEditorState } from "lexical";
import type { LucideIcon } from "lucide-react";
import type { RefObject } from "react";

export const COMPOSER_MAX_CHARACTERS = 8_000;

/** Shared upload and focus controls for a host-owned composer actions menu. */
export interface ComposerActionControls {
	/** Opens the composer's existing upload picker. */
	onAttachFiles: () => void;
	/** Connects the host trigger to overlays that return composer focus. */
	triggerRef: RefObject<HTMLButtonElement | null>;
	/** Optional stable DOM id assigned by the conversation host. */
	triggerId?: string;
	/** Prevents actions while the composer submits its current message. */
	disabled: boolean;
}

/** A host-owned destination in the composer's + menu. */
export interface ComposerPanelAction {
	id: string;
	label: string;
	icon: LucideIcon;
	disabled?: boolean;
	onSelect: () => void;
}
/** A saved prompt inserts editable text; it never submits automatically. */
export interface ComposerPrompt {
	id: string;
	title: string;
	context: string;
}

/** In-memory document and file selection used to resume a composer after navigation. */
export interface ComposerDraft {
	document: SerializedEditorState | null;
	text: string;
	files: File[];
}
