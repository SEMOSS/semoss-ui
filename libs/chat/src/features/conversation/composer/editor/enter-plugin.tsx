import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from "lexical";
import { useEffect } from "react";

/** Props for {@link EnterPlugin}. */
interface EnterPluginProps {
	/** Sends the message. */
	onEnter: () => void;
}

/** Sends on Enter; Shift+Enter and Enter during IME composition insert as usual. */
export const EnterPlugin: React.FC<EnterPluginProps> = ({ onEnter }) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event) => {
				if (!event || event.isComposing || editor.isComposing()) {
					return false;
				}

				// if there is no shift key, we submit the message
				if (!event.shiftKey) {
					event.preventDefault();
					onEnter();
					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, onEnter]);

	return null;
};
