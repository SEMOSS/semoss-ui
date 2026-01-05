import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

export const FocusPlugin: React.FC = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		// Listen for editable state changes
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
