import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, COMMAND_PRIORITY_LOW, PASTE_COMMAND } from "lexical";
import { useEffect } from "react";

/** Keep the caret visible after a large paste expands the composer. */
export function RoomComposerPasteScrollPlugin({
	scrollRef,
}: {
	scrollRef: React.RefObject<HTMLElement | null>;
}) {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand<ClipboardEvent>(
				PASTE_COMMAND,
				() => {
					requestAnimationFrame(() => {
						editor.update(() => $getRoot().selectEnd());
						const viewport = scrollRef.current;
						if (viewport)
							viewport.scrollTop = viewport.scrollHeight;
					});
					return false;
				},
				COMMAND_PRIORITY_LOW,
			),
		[editor, scrollRef],
	);

	return null;
}
