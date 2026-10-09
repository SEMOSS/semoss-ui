import { $isLinkNode } from "@lexical/link";
import { $isListNode } from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import {
	$getSelectionStyleValueForProperty,
	$patchStyleText,
} from "@lexical/selection";
import {
	$getTableCellNodeFromLexicalNode,
	$isTableSelection,
} from "@lexical/table";
import {
	$findMatchingParent,
	$getNodeByKey,
	$getRoot,
	$getSelection,
	$isElementNode,
	$isRangeSelection,
	$setSelection,
	type BaseSelection,
	CAN_REDO_COMMAND,
	CAN_UNDO_COMMAND,
	COMMAND_PRIORITY_LOW,
	type LexicalEditor,
} from "lexical";
import { useEffect, useRef, useState } from "react";

interface EmailFormats {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	block: string;
	size: string;
	color: string;
	alignment: string;
	list: string;
	link: string;
	table: boolean;
}

interface EmailFormatting {
	editor: LexicalEditor;
	formats: EmailFormats;
	canUndo: boolean;
	canRedo: boolean;
	apply: (action: () => void) => void;
	style: (property: string, value: string) => void;
}

/** Track the actual selection and restore it after toolbar controls receive focus. */
export function useEmailFormatting(disabled: boolean): EmailFormatting {
	const [editor] = useLexicalComposerContext();
	const selected = useRef<BaseSelection | null>(null);
	const [formats, setFormats] = useState<EmailFormats>({
		bold: false,
		italic: false,
		underline: false,
		block: "paragraph",
		size: "",
		color: "",
		alignment: "left",
		list: "",
		link: "",
		table: false,
	});
	const [canUndo, setCanUndo] = useState(false);
	const [canRedo, setCanRedo] = useState(false);
	useEffect(() => {
		const update = editor.registerUpdateListener(({ editorState }) =>
			editorState.read(() => {
				const selection = $getSelection();
				if (
					!$isRangeSelection(selection) &&
					!$isTableSelection(selection)
				)
					return;
				selected.current = selection.clone();
				const anchor = selection.anchor.getNode();
				const block = $findMatchingParent(
					anchor,
					(node) => $isElementNode(node) && !node.isInline(),
				);
				const list = $findMatchingParent(anchor, $isListNode);
				const link = $findMatchingParent(anchor, $isLinkNode);
				setFormats({
					bold:
						$isRangeSelection(selection) &&
						selection.hasFormat("bold"),
					italic:
						$isRangeSelection(selection) &&
						selection.hasFormat("italic"),
					underline:
						$isRangeSelection(selection) &&
						selection.hasFormat("underline"),
					block: $isHeadingNode(block)
						? block.getTag()
						: $isQuoteNode(block)
							? "quote"
							: "paragraph",
					size: $getSelectionStyleValueForProperty(
						selection,
						"font-size",
					),
					color: $getSelectionStyleValueForProperty(
						selection,
						"color",
					),
					alignment: $isElementNode(block)
						? block.getFormatType() || "left"
						: "left",
					list: $isListNode(list) ? list.getListType() : "",
					link: $isLinkNode(link) ? link.getURL() : "",
					table: Boolean($getTableCellNodeFromLexicalNode(anchor)),
				});
			}),
		);
		const undo = editor.registerCommand(
			CAN_UNDO_COMMAND,
			(value) => {
				setCanUndo(value);
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		const redo = editor.registerCommand(
			CAN_REDO_COMMAND,
			(value) => {
				setCanRedo(value);
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
		return () => {
			update();
			undo();
			redo();
		};
	}, [editor]);
	const apply = (action: () => void): void => {
		if (disabled || !editor.isEditable()) return;
		editor.update(() => {
			const selection = selected.current;
			// A form reset or undo can remove nodes from the previously saved selection.
			if (
				($isRangeSelection(selection) ||
					$isTableSelection(selection)) &&
				$getNodeByKey(selection.anchor.key)?.isAttached() &&
				$getNodeByKey(selection.focus.key)?.isAttached()
			) {
				$setSelection(selection.clone());
			} else if (!$getSelection()) {
				$getRoot().selectEnd();
			}
			action();
		});
		editor.focus();
	};
	const style = (property: string, value: string): void =>
		apply(() => {
			const selection = $getSelection();
			if ($isRangeSelection(selection) || $isTableSelection(selection)) {
				$patchStyleText(selection, { [property]: value });
			}
		});
	return { editor, formats, canUndo, canRedo, apply, style };
}
