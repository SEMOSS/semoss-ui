import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, PASTE_COMMAND } from "lexical";
import { useEffect, useRef } from "react";

/** Props for {@link AutoScrollOnPastePlugin}. */
interface AutoScrollOnPastePluginProps {
	/** The element that scrolls the editor's content. */
	scrollContainerRef: React.RefObject<HTMLElement | null>;
}

/** Scrolls the editor to its end after a paste, once the pasted content has rendered. */
export function AutoScrollOnPastePlugin(props: AutoScrollOnPastePluginProps) {
	const [editor] = useLexicalComposerContext();
	const didPasteRef = useRef(false);

	useEffect(() => {
		return editor.registerCommand<ClipboardEvent>(
			PASTE_COMMAND,
			() => {
				didPasteRef.current = true;

				requestAnimationFrame(() => {
					if (!didPasteRef.current) return;
					didPasteRef.current = false;

					// Scroll to bottom without moving the cursor
					const el = props.scrollContainerRef.current;
					if (el) el.scrollTop = el.scrollHeight;
				});

				return false; // let Lexical perform its normal paste
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, props.scrollContainerRef]);

	return null;
}
