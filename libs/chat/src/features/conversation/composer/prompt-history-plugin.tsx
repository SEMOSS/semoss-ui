import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createLineBreakNode,
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_NORMAL,
	type EditorState,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ARROW_UP_COMMAND,
	KEY_ESCAPE_COMMAND,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { isAtEditorLineBoundary } from "./editor/editor-line-boundary";
import {
	type PromptHistoryEntry,
	RESET_PROMPT_HISTORY_COMMAND,
} from "./prompt-history";

/** One run of browsing, from the first Up until the draft is back or a prompt is sent. */
interface HistorySession {
	/** What the input held before browsing, restored on Escape or past the newest entry. */
	draft: EditorState;
	/** The prompts as they were when browsing started. */
	entries: readonly PromptHistoryEntry[];
	/** The entry shown, or -1 for the draft. */
	index: number;
	/** Changes made to a recalled prompt, by entry id, kept while browsing. */
	edits: Map<string, EditorState>;
}

/** Props for {@link PromptHistoryPlugin}. */
interface PromptHistoryPluginProps {
	/** Newest-first prompts from this conversation's active branch. */
	entries: readonly PromptHistoryEntry[];
}

/**
 * Recalls the conversation's earlier prompts into the input with Up and Down
 * on its first and last lines, and puts the draft back with Escape. Key it by
 * room and branch so each has its own session. Announces the position to
 * screen readers.
 */
export function PromptHistoryPlugin({ entries }: PromptHistoryPluginProps) {
	const [editor] = useLexicalComposerContext();
	const { t } = useTranslation("room");
	const session = useRef<HistorySession | null>(null);
	const [position, setPosition] = useState<{
		index: number;
		total: number;
	} | null>(null);
	const [isRestored, setIsRestored] = useState(false);

	useEffect(() => {
		// The effect can rerun before a queued restore runs; skip it then.
		let isActive = true;
		const applySnapshot = (state: EditorState, selectEnd = false): void => {
			// Key commands run inside updates. Restore after the command finishes
			// so Lexical can clone frozen nodes and selection into writable state.
			queueMicrotask(() => {
				if (!isActive) return;
				editor.setEditorState(state);
				if (selectEnd) {
					editor.update(() => $getRoot().selectEnd(), {
						discrete: true,
					});
				}
			});
		};
		const reset = (): boolean => {
			session.current = null;
			setPosition(null);
			setIsRestored(false);
			return false;
		};
		const canHandle = (event: KeyboardEvent): boolean => {
			const selection = $getSelection();
			return (
				!event.defaultPrevented &&
				!event.altKey &&
				!event.ctrlKey &&
				!event.metaKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!editor.isComposing() &&
				editor.isEditable() &&
				$isRangeSelection(selection) &&
				selection.isCollapsed()
			);
		};
		const restore = (): void => {
			if (!session.current) return;
			const draft = session.current.draft;
			applySnapshot(draft);
			reset();
			setIsRestored(true);
		};
		const navigate = (event: KeyboardEvent, direction: "up" | "down") => {
			const root = editor.getRootElement();
			if (
				!root ||
				!canHandle(event) ||
				!isAtEditorLineBoundary(root, direction)
			)
				return false;
			if (!session.current) {
				if (direction === "down" || !entries.length) return false;
				session.current = {
					draft: editor.getEditorState(),
					entries,
					index: -1,
					edits: new Map(),
				};
			}
			const current = session.current;
			const nextIndex = current.index + (direction === "up" ? 1 : -1);
			event.preventDefault();
			if (nextIndex >= current.entries.length) return true;
			if (nextIndex < 0) {
				restore();
				return true;
			}
			// Keep edits to the entry being left, so coming back shows them.
			const previous = current.entries[current.index];
			if (previous)
				current.edits.set(previous.id, editor.getEditorState());
			const entry = current.entries[nextIndex];
			if (!entry) return true;
			current.index = nextIndex;
			const edited = current.edits.get(entry.id);
			if (edited) {
				applySnapshot(edited, true);
			} else {
				const editorRoot = $getRoot();
				editorRoot.clear();
				const paragraph = $createParagraphNode();
				for (const [index, line] of entry.text
					.split(/\r?\n/)
					.entries()) {
					if (index > 0) paragraph.append($createLineBreakNode());
					paragraph.append($createTextNode(line));
				}
				editorRoot.append(paragraph);
				$getRoot().selectEnd();
			}
			setPosition({
				index: nextIndex + 1,
				total: current.entries.length,
			});
			setIsRestored(false);
			return true;
		};

		// Slash suggestions use HIGH priority; native text movement uses LOW.
		const unregister = [
			editor.registerCommand(
				KEY_ARROW_UP_COMMAND,
				(event) => navigate(event, "up"),
				COMMAND_PRIORITY_NORMAL,
			),
			editor.registerCommand(
				KEY_ARROW_DOWN_COMMAND,
				(event) => navigate(event, "down"),
				COMMAND_PRIORITY_NORMAL,
			),
			editor.registerCommand(
				KEY_ESCAPE_COMMAND,
				(event) => {
					if (!session.current || !canHandle(event)) return false;
					event.preventDefault();
					restore();
					return true;
				},
				COMMAND_PRIORITY_NORMAL,
			),
			editor.registerCommand(
				RESET_PROMPT_HISTORY_COMMAND,
				reset,
				COMMAND_PRIORITY_NORMAL,
			),
		];
		return () => {
			isActive = false;
			for (const remove of unregister) remove();
		};
	}, [editor, entries]);

	return (
		<output aria-atomic="true" className="sr-only">
			{position
				? t("input.historyHint", position)
				: isRestored
					? t("input.draftRestored")
					: ""}
		</output>
	);
}
