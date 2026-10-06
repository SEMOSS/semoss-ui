import type { SerializedEditorState } from "lexical";
import type { LucideIcon } from "lucide-react";

export const COMPOSER_MAX_CHARACTERS = 8_000;

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
