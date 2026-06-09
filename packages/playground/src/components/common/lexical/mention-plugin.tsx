import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalNode } from "lexical";
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_HIGH,
	KEY_ARROW_DOWN_COMMAND,
	KEY_ARROW_UP_COMMAND,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	KEY_TAB_COMMAND,
	TextNode,
} from "lexical";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface MentionPluginProps {
	/** Character that triggers the menu (default: "/") */
	trigger: string;

	/** Rendered as the suggestion menu */
	MenuComponent: React.ComponentType<{
		isOpen: boolean;
		onOpenChange: (isOpen: boolean) => void;
		menuPosition: { top: number; bottom: number; left: number } | null;
		addToken: (token: string) => void;
		/** Insert a Lexical node in place of the trigger + query text */
		addNode: (nodeFactory: () => LexicalNode) => void;
		onRequestClose: () => void;
		/** Text typed after the trigger character, for filtering */
		query: string;
		/** Index of the currently highlighted item */
		selectedIndex: number;
		/** Called by MenuComponent to report how many items are visible */
		setItemCount: (count: number) => void;
		/** Called by MenuComponent to sync hover/external selection back up */
		setSelectedIndex: (index: number) => void;
	}>;

	/**
	 * Called when Enter is pressed while the menu is open. The plugin closes
	 * the menu (removing trigger + query text) after this fires unless addNode
	 * was already called (which resets triggerOffsetRef).
	 */
	onAccept?: (
		query: string,
		selectedIndex: number,
		addNode: (nodeFactory: () => LexicalNode) => void,
	) => void;

	/**
	 * Called when Tab is pressed. If it returns a string, that string replaces
	 * the current query in the editor and the menu stays open. Return undefined
	 * to do nothing.
	 */
	onTabComplete?: (
		query: string,
		selectedIndex: number,
	) => string | undefined;
}

export const MentionPlugin: React.FC<MentionPluginProps> = ({
	trigger = "/",
	MenuComponent,
	onAccept,
	onTabComplete,
}) => {
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		bottom: number;
		left: number;
	} | null>(null);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	const triggerOffsetRef = useRef<number | null>(null);
	const explicitlyClosedRef = useRef(false);

	// Stable refs so key-command handlers don't need to re-register on every render
	const queryRef = useRef(query);
	queryRef.current = query;
	const selectedIndexRef = useRef(selectedIndex);
	selectedIndexRef.current = selectedIndex;
	const onAcceptRef = useRef(onAccept);
	onAcceptRef.current = onAccept;
	const onTabCompleteRef = useRef(onTabComplete);
	onTabCompleteRef.current = onTabComplete;
	const itemCountRef = useRef(0);

	// Reset selection when the filtered list changes (new query = start from top)
	// biome-ignore lint/correctness/useExhaustiveDependencies: The effect should only run when the query changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [query]);

	const setItemCount = useCallback((count: number) => {
		itemCountRef.current = count;
	}, []);

	const setSelectedIndexCallback = useCallback((index: number) => {
		setSelectedIndex(index);
	}, []);

	/** Insert a token after the trigger, replacing trigger + query text */
	const addToken = useCallback(
		(token: string) => {
			const triggerIdx = triggerOffsetRef.current;
			if (triggerIdx === null) return false;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();
				if (!$isTextNode(anchorNode)) return;

				const textContent = anchorNode.getTextContent();
				const textBeforeTrigger = textContent.slice(0, triggerIdx);
				const textAfterCursor = textContent.slice(anchor.offset);

				const tokenNode = $createTextNode(token);

				if (textBeforeTrigger) {
					anchorNode.setTextContent(textBeforeTrigger);
					anchorNode.insertAfter(tokenNode);
				} else {
					anchorNode.replace(tokenNode);
				}

				const spaceNode = new TextNode(" ");
				tokenNode.insertAfter(spaceNode);

				if (textAfterCursor) {
					spaceNode.insertAfter(new TextNode(textAfterCursor));
				}

				spaceNode.select(1, 1);
			});

			setIsOpen(false);
			explicitlyClosedRef.current = false;
			triggerOffsetRef.current = null;
		},
		[editor],
	);

	/** Insert an arbitrary Lexical node in place of the trigger + query text */
	const addNode = useCallback(
		(nodeFactory: () => LexicalNode) => {
			const triggerIdx = triggerOffsetRef.current;
			if (triggerIdx === null) return;

			editor.update(() => {
				const node = nodeFactory();

				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();
				if (!$isTextNode(anchorNode)) return;

				const textContent = anchorNode.getTextContent();
				const textBeforeTrigger = textContent.slice(0, triggerIdx);
				const textAfterCursor = textContent.slice(anchor.offset);

				if (textBeforeTrigger) {
					anchorNode.setTextContent(textBeforeTrigger);
					anchorNode.insertAfter(node);
				} else {
					anchorNode.replace(node);
				}

				const spaceNode = new TextNode(" ");
				node.insertAfter(spaceNode);

				if (textAfterCursor) {
					spaceNode.insertAfter(new TextNode(textAfterCursor));
				}

				spaceNode.select(1, 1);
			});

			setIsOpen(false);
			explicitlyClosedRef.current = false;
			triggerOffsetRef.current = null;
		},
		[editor],
	);

	/**
	 * Replace the text between the trigger character and the cursor with
	 * `replacement`. Keeps the trigger character in place and leaves the
	 * menu open so the user can continue filtering or press Enter.
	 */
	const replaceQuery = useCallback(
		(replacement: string) => {
			const triggerIdx = triggerOffsetRef.current;
			if (triggerIdx === null) return;

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) return;

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();
				if (!$isTextNode(anchorNode)) return;

				const textContent = anchorNode.getTextContent();
				// Preserve text up to and including the trigger character
				const textBefore = textContent.slice(0, triggerIdx + 1);
				const textAfter = textContent.slice(anchor.offset);

				anchorNode.setTextContent(textBefore + replacement + textAfter);

				// Move cursor to just after the replacement
				const newOffset = triggerIdx + 1 + replacement.length;
				anchorNode.select(newOffset, newOffset);
			});
			// Intentionally do NOT close the menu
		},
		[editor],
	);

	/** Remove trigger + query text and close the menu */
	const handleRequestClose = useCallback(() => {
		const triggerIdx = triggerOffsetRef.current;
		if (triggerIdx === null) return;

		editor.update(() => {
			const selection = $getSelection();
			if (!$isRangeSelection(selection)) return;

			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();
			if (!$isTextNode(anchorNode)) return;

			const textContent = anchorNode.getTextContent();
			const textBeforeTrigger = textContent.slice(0, triggerIdx);
			const textAfterCursor = textContent.slice(anchor.offset);
			anchorNode.setTextContent(textBeforeTrigger + textAfterCursor);
			anchorNode.select(
				textBeforeTrigger.length,
				textBeforeTrigger.length,
			);
		});

		editor.focus();
		setIsOpen(false);
		explicitlyClosedRef.current = false;
		triggerOffsetRef.current = null;
	}, [editor]);

	// Detect trigger character as user types
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

				// Find the last trigger character before the cursor
				let triggerIndex = -1;
				for (let i = cursorOffset - 1; i >= 0; i--) {
					if (text[i] === trigger) {
						if (i === 0 || /\s/.test(text[i - 1])) {
							triggerIndex = i;
							break;
						}
					}
					if (/\s/.test(text[i])) break;
				}

				if (triggerIndex !== -1) {
					const isNewTrigger =
						triggerOffsetRef.current !== triggerIndex;
					if (isNewTrigger) explicitlyClosedRef.current = false;

					if (!explicitlyClosedRef.current) {
						triggerOffsetRef.current = triggerIndex;
						setIsOpen(true);
						setQuery(text.slice(triggerIndex + 1, cursorOffset));

						if (isNewTrigger) {
							const domSelection = window.getSelection();
							if (domSelection && domSelection.rangeCount > 0) {
								const range = domSelection.getRangeAt(0);
								const rect = range.getBoundingClientRect();
								setMenuPosition({
									top: rect.top,
									bottom: rect.bottom,
									left: rect.left,
								});
							}
						}
					}
				} else {
					setIsOpen(false);
					setQuery("");
					explicitlyClosedRef.current = false;
					triggerOffsetRef.current = null;
				}
			});
		});
	}, [editor, trigger]);

	// Keyboard commands while menu is open
	useEffect(() => {
		if (!isOpen) return;

		const removeEnter = editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event) => {
				event?.preventDefault();
				onAcceptRef.current?.(
					queryRef.current,
					selectedIndexRef.current,
					addNode,
				);
				// addNode resets triggerOffsetRef, so handleRequestClose becomes
				// a no-op when the caller inserted a node rather than just executing
				handleRequestClose();
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const removeTab = editor.registerCommand(
			KEY_TAB_COMMAND,
			(event) => {
				event?.preventDefault();
				const completion = onTabCompleteRef.current?.(
					queryRef.current,
					selectedIndexRef.current,
				);
				if (completion !== undefined) replaceQuery(completion);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const removeArrowDown = editor.registerCommand(
			KEY_ARROW_DOWN_COMMAND,
			(event) => {
				event?.preventDefault();
				setSelectedIndex((prev) =>
					Math.min(prev + 1, itemCountRef.current - 1),
				);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const removeArrowUp = editor.registerCommand(
			KEY_ARROW_UP_COMMAND,
			(event) => {
				event?.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		const removeEscape = editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			(event) => {
				event?.preventDefault();
				explicitlyClosedRef.current = true;
				setIsOpen(false);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);

		return () => {
			removeEnter();
			removeTab();
			removeArrowDown();
			removeArrowUp();
			removeEscape();
		};
	}, [editor, isOpen, handleRequestClose, replaceQuery, addNode]);

	// Restore editor focus when menu closes
	useEffect(() => {
		if (isOpen) return;
		editor.focus(() => null, { defaultSelection: "rootEnd" });
	}, [editor, isOpen]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isOpen) explicitlyClosedRef.current = true;
			setIsOpen(open);
		},
		[isOpen],
	);

	if (!isOpen || !menuPosition) return null;

	return (
		<MenuComponent
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			menuPosition={menuPosition}
			addToken={addToken}
			addNode={addNode}
			onRequestClose={handleRequestClose}
			query={query}
			selectedIndex={selectedIndex}
			setItemCount={setItemCount}
			setSelectedIndex={setSelectedIndexCallback}
		/>
	);
};
