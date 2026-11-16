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
import { COMPOSER_MAX_CHARACTERS } from "./room-composer.types";

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
					const hasTable = /<table[\s>]/i.test(html);
					if (hasTable) handledChatTablePastes.add(event);
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) return true;
					const room =
						COMPOSER_MAX_CHARACTERS -
						$getRoot().getTextContent().length +
						selection.getTextContent().length;
					let doc: Document | null = null;
					let reason = "";
					try {
						if (hasTable) doc = chatImportDocument(html);
						// One cell is a value, such as a single spreadsheet cell, not a table.
						if (doc && doc.querySelectorAll("td,th").length < 2)
							doc = null;
						if (doc) {
							let ancestor = selection.anchor.getNode();
							while (ancestor.getParent()) {
								if ($isTableCellNode(ancestor))
									throw new Error(
										"Paste a new table outside the existing table.",
									);
								const parent = ancestor.getParent();
								if (!parent) break;
								ancestor = parent;
							}
							if ((doc.body.textContent?.length ?? 0) > room)
								throw new Error(
									"This table exceeds the message limit. Attach the source document instead.",
								);
						}
					} catch (cause) {
						doc = null;
						reason =
							cause instanceof Error
								? cause.message
								: "This table could not be pasted. Attach the source document instead.";
					}
					if (doc) {
						selection.insertNodes(
							$generateNodesFromDOM(editor, doc),
						);
						onNotice(
							/<(?:img|iframe|video|audio|object)\b/i.test(html)
								? "Pasted the table; embedded images and resources were omitted. Attach the source to include them."
								: "",
						);
						return true;
					}
					// A table that cannot be kept still pastes its values as text, but never a cut-off copy of them.
					const pastesPlain =
						Boolean(plain) && (!reason || plain.length <= room);
					if (pastesPlain) selection.insertRawText(plain);
					let notice = "";
					if (reason)
						notice = pastesPlain
							? `Pasted as plain text. ${reason}`
							: reason;
					else if (html && !plain)
						notice =
							"This clipboard content has no supported table or plain text. Copy the text again or attach the source document.";
					else if (/\t/.test(plain))
						notice =
							"Pasted as plain text; the clipboard did not supply an HTML table.";
					onNotice(notice);
					return true;
				},
				COMMAND_PRIORITY_HIGH,
			),
		[editor, onNotice],
	);
	return null;
}
