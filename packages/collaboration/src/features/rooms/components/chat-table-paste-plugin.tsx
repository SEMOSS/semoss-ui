import { $generateNodesFromDOM } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isTableCellNode } from "@lexical/table";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	PASTE_COMMAND,
} from "lexical";
import { useEffect } from "react";
import { chatImportDocument } from "./chat-rich-content";

/** Import table HTML atomically, and route all other paste through safe plain text. */
export const handledChatTablePastes = new WeakSet<Event>();

export function ChatTablePastePlugin({
	onNotice,
}: {
	onNotice: (message: string) => void;
}) {
	const [editor] = useLexicalComposerContext();
	useEffect(
		() =>
			editor.registerCommand(
				PASTE_COMMAND,
				(event) => {
					if (
						!(event instanceof ClipboardEvent) ||
						!event.clipboardData
					)
						return false;
					const html = event.clipboardData.getData("text/html");
					const plain = event.clipboardData.getData("text/plain");
					if (!html && !plain) return false;
					event.preventDefault();
					if (/<table[\s>]/i.test(html))
						handledChatTablePastes.add(event);
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return true;
					if (!/<table[\s>]/i.test(html)) {
						if (plain) selection.insertRawText(plain);
						onNotice(
							html && !plain
								? "This clipboard content has no supported table or plain text. Copy the text again or attach the source document."
								: /\t/.test(plain)
									? "Pasted as plain text; the clipboard did not supply an HTML table."
									: "",
						);
						return true;
					}
					try {
						let ancestor = selection.anchor.getNode();
						while (ancestor.getParent()) {
							if ($isTableCellNode(ancestor))
								throw new Error(
									"Paste a new table outside the existing table, or paste plain text into its cell.",
								);
							const parent = ancestor.getParent();
							if (!parent) break;
							ancestor = parent;
						}
						const doc = chatImportDocument(html);
						if (
							(doc.body.textContent?.length ?? 0) +
								$getRoot().getTextContent().length -
								selection.getTextContent().length >
							8000
						)
							throw new Error(
								"This table exceeds the message limit. Attach the source document instead.",
							);
						selection.insertNodes(
							$generateNodesFromDOM(editor, doc),
						);
						onNotice(
							/<(?:img|iframe|video|audio|object)\b/i.test(html)
								? "Pasted the table; embedded images and resources were omitted. Attach the source to include them."
								: "",
						);
					} catch (cause) {
						onNotice(
							cause instanceof Error
								? cause.message
								: "This table could not be pasted. Attach the source document instead.",
						);
					}
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),
		[editor, onNotice],
	);
	return null;
}
