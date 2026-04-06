import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	TextNode,
} from "lexical";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface MentionPluginProps {
	/**
	 * Trigger
	 */
	trigger: string;

	/**
	 * Menu component
	 */
	MenuComponent: React.ComponentType<{
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		menuPosition: { top: number; left: number } | null;
		addToken: (token: string) => void;
		onRequestClose: () => void;
	}>;
}

export const MentionPlugin: React.FC<MentionPluginProps> = ({
	trigger = "/",
	MenuComponent,
}) => {
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);

	const triggerOffsetRef = useRef<number | null>(null);
	const explicitlyClosedRef = useRef(false);

	/**
	 * Call back to add a token
	 */
	const addToken = useCallback(
		(token: string) => {
			const triggerIdx = triggerOffsetRef.current;
			if (triggerIdx === null) {
				return false;
			}

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					return;
				}

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();

				if (!$isTextNode(anchorNode)) {
					return;
				}

				// get the text content
				const textContent = anchorNode.getTextContent();

				// Get text before trigger
				const textBeforeTrigger = textContent.slice(0, triggerIdx);

				// Get text after cursor
				const textAfterCursor = textContent.slice(anchor.offset);

				// Add the node
				const textNode = $createTextNode(token);

				// Update the text node
				if (textBeforeTrigger) {
					anchorNode.setTextContent(textBeforeTrigger);
					anchorNode.insertAfter(textNode);
				} else {
					anchorNode.replace(textNode);
				}

				// Add text after cursor if any
				if (textAfterCursor) {
					const textNode = new TextNode(textAfterCursor);
					textNode.insertAfter(textNode);
				}

				// Add a space after the badge and move selection there
				const spaceNode = new TextNode(" ");
				textNode.insertAfter(spaceNode);
				spaceNode.select();
			});

			setIsOpen(false);
			explicitlyClosedRef.current = false;
			triggerOffsetRef.current = null;
		},
		[editor],
	);

	/**
	 * Callback to close menu and remove trigger text
	 */
	const handleRequestClose = useCallback(() => {
		const triggerIdx = triggerOffsetRef.current;
		if (triggerIdx === null) {
			return;
		}

		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) {
				return;
			}

			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();

			if (!$isTextNode(anchorNode)) {
				return;
			}

			const textContent = anchorNode.getTextContent();

			// Remove from trigger to cursor
			const textBeforeTrigger = textContent.slice(0, triggerIdx);
			const textAfterCursor = textContent.slice(anchor.offset);
			const newText = textBeforeTrigger + textAfterCursor;

			anchorNode.setTextContent(newText);

			// Select at the trigger position (now the join point)
			// Use the length of textBeforeTrigger to ensure we're within bounds
			anchorNode.select(
				textBeforeTrigger.length,
				textBeforeTrigger.length,
			);
		});

		// Focus editor immediately before closing menu
		editor.focus();

		setIsOpen(false);
		explicitlyClosedRef.current = false;
		triggerOffsetRef.current = null;
	}, [editor]);

	// Handle text changes to detect trigger
	useEffect(() => {
		return editor.registerTextContentListener(() => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					setIsOpen(false);
					explicitlyClosedRef.current = false;
					return;
				}

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();

				if (!$isTextNode(anchorNode)) {
					setIsOpen(false);
					explicitlyClosedRef.current = false;
					return;
				}

				const text = anchorNode.getTextContent();
				const cursorOffset = anchor.offset;

				// Find the last trigger before cursor
				let triggerIndex = -1;
				for (let i = cursorOffset - 1; i >= 0; i--) {
					if (text[i] === trigger) {
						// Check if it's at the start or preceded by a space
						if (i === 0 || /\s/.test(text[i - 1])) {
							triggerIndex = i;
							break;
						}
					}
					// Stop if we hit a space (no trigger in current word)
					if (/\s/.test(text[i])) {
						break;
					}
				}

				if (triggerIndex !== -1) {
					// Check if this is a new trigger position or if menu was explicitly closed
					const isNewTrigger =
						triggerOffsetRef.current !== triggerIndex;

					if (isNewTrigger) {
						// New trigger position - reset explicit closure flag
						explicitlyClosedRef.current = false;
					}

					// Only open if not explicitly closed
					if (!explicitlyClosedRef.current) {
						triggerOffsetRef.current = triggerIndex;
						setIsOpen(true);

						// Calculate menu position
						const domSelection = window.getSelection();
						if (domSelection && domSelection.rangeCount > 0) {
							const range = domSelection.getRangeAt(0);
							const rect = range.getBoundingClientRect();
							setMenuPosition({
								top: rect.bottom + window.scrollY + 4,
								left: rect.left + window.scrollX,
							});
						}
					}
				} else {
					// No trigger found - reset everything
					setIsOpen(false);
					explicitlyClosedRef.current = false;
					triggerOffsetRef.current = null;
				}
			});
		});
	}, [editor, trigger]);

	// focus on the editor when menu is closed
	useEffect(() => {
		if (isOpen) {
			return;
		}
		editor.focus(() => null, {
			defaultSelection: "rootEnd",
		});
	}, [editor, isOpen]);

	// Track explicit closure
	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isOpen) {
				// User explicitly closed the menu
				explicitlyClosedRef.current = true;
			}
			setIsOpen(open);
		},
		[isOpen],
	);

	// don't show if not open and there is no position
	if (!isOpen || !menuPosition) {
		return null;
	}

	return (
		<MenuComponent
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			menuPosition={menuPosition}
			addToken={addToken}
			onRequestClose={handleRequestClose}
		/>
	);
};
