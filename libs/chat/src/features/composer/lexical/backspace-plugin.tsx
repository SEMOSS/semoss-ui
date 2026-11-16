import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	COMMAND_PRIORITY_LOW,
	KEY_BACKSPACE_COMMAND,
	KEY_DELETE_COMMAND,
} from "lexical";
import { useEffect } from "react";

interface BackspacePluginProps {
	/**
	 * Called on Backspace or Delete. Return true to mark the key handled
	 * (Lexical won't also run its own deletion), false to let Lexical
	 * handle it normally.
	 */
	onBackspace: (event: KeyboardEvent) => boolean;
}

export const BackspacePlugin: React.FC<BackspacePluginProps> = ({
	onBackspace,
}) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const removeBackspace = editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			onBackspace,
			COMMAND_PRIORITY_LOW,
		);
		const removeDelete = editor.registerCommand(
			KEY_DELETE_COMMAND,
			onBackspace,
			COMMAND_PRIORITY_LOW,
		);

		return () => {
			removeBackspace();
			removeDelete();
		};
	}, [editor, onBackspace]);

	return null;
};
