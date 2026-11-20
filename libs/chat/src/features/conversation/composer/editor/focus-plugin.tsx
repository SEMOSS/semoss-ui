import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

/** Focuses the editor, caret at the end, whenever it becomes editable again, as when a turn finishes. */
export const FocusPlugin: React.FC = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerEditableListener((isEditable) => {
			if (isEditable) {
				// TODO: find a better way to focus the editor after it becomes editable
				setTimeout(
					() =>
						editor.focus(() => null, {
							defaultSelection: "rootEnd",
						}),
					100,
				);
			}
		});
	}, [editor]);

	return null;
};
