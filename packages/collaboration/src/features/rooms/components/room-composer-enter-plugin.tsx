import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from "lexical";
import { useEffect } from "react";

/** Submit on Enter while preserving Shift+Enter and IME composition. */
export function RoomComposerEnterPlugin({
	onSubmit,
}: {
	onSubmit: () => void;
}) {
	const [editor] = useLexicalComposerContext();

	useEffect(
		() =>
			editor.registerCommand(
				KEY_ENTER_COMMAND,
				(event) => {
					if (
						!event ||
						event.shiftKey ||
						event.isComposing ||
						event.keyCode === 229
					) {
						return false;
					}
					event.preventDefault();
					onSubmit();
					return true;
				},
				COMMAND_PRIORITY_LOW,
			),
		[editor, onSubmit],
	);

	return null;
}
