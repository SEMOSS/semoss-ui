import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { sanitizeDraftHtml } from "./email-html";

/** Sanitize clipboard HTML before Lexical imports it; lock editing during writes. */
export function EmailEditorPlugin({
	disabled = false,
}: {
	disabled?: boolean;
}) {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editor.setEditable(!disabled);
	}, [editor, disabled]);
	useEffect(
		() =>
			editor.registerCommand(
				PASTE_COMMAND,
				(event) => {
					if (!(event instanceof ClipboardEvent)) return false;
					const html = event.clipboardData?.getData("text/html");
					if (!html) return false;
					event.preventDefault();
					const selection = $getSelection();
					if ($isRangeSelection(selection)) {
						const doc = new DOMParser().parseFromString(
							sanitizeDraftHtml(html),
							"text/html",
						);
						selection.insertNodes(
							$generateNodesFromDOM(editor, doc),
						);
					}
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),
		[editor],
	);
	return null;
}
