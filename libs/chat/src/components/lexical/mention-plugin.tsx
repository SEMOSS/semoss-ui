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
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

/** Where the menu anchors: the caret's rectangle when the trigger was typed, in viewport px. */
export interface MentionMenuPosition {
	top: number;
	bottom: number;
	left: number;
}

/** What {@link MentionPluginProps.renderMenu} draws the menu from. */
export interface MentionMenuProps {
	/** Whether the menu is open. */
	isOpen: boolean;
	/** Opens or closes the menu; closing keeps the typed text. */
	onOpenChange: (isOpen: boolean) => void;
	/** Where the menu anchors. */
	menuPosition: MentionMenuPosition | null;
	/** Insert a text token in place of the trigger + query text */
	addToken: (token: string) => void;
	/** Insert a Lexical node in place of the trigger + query text */
	addNode: (nodeFactory: () => LexicalNode) => void;
	/** Removes the trigger + query text and closes the menu. */
	onRequestClose: () => void;
	/** Text typed after the trigger character, for filtering */
	query: string;
	/** Index of the currently highlighted item */
	selectedIndex: number;
	/** Called by the menu to report how many items are visible */
	onItemCountChange: (count: number) => void;
	/** Called by the menu to sync hover/external selection back up */
	onSelectedIndexChange: (index: number) => void;
}

/** Props for {@link MentionPlugin}. */
interface MentionPluginProps {
	/** Character that triggers the menu (default: "/") */
	trigger: string;

	/**
	 * Draws the suggestion menu while it is open. Called rather than mounted,
	 * so a new function each render does not remount the menu.
	 */
	renderMenu: (props: MentionMenuProps) => ReactNode;

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

/**
 * Opens a suggestion menu when the trigger character is typed at the start of
 * a word, tracks the query typed after it, and drives the menu from the
 * keyboard: arrows move the highlight, Enter accepts, Tab completes, and
 * Escape closes it until a new trigger is typed.
 */
export const MentionPlugin: React.FC<MentionPluginProps> = ({
	trigger = "/",
	renderMenu,
	onAccept,
	onTabComplete,
}) => {
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [menuPosition, setMenuPosition] =
		useState<MentionMenuPosition | null>(null);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);

	// where the trigger character sits in its text node, while the menu is in use
	const triggerOffsetRef = useRef<number | null>(null);
	// Escape or a click away closed the menu; it stays closed for this trigger
	const isExplicitlyClosedRef = useRef(false);

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

	// a ref, not state: only the arrow keys read the count
	const handleItemCountChange = useCallback((count: number) => {
		itemCountRef.current = count;
	}, []);

	const handleSelectedIndexChange = useCallback((index: number) => {
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
			isExplicitlyClosedRef.current = false;
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
			isExplicitlyClosedRef.current = false;
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
		isExplicitlyClosedRef.current = false;
		triggerOffsetRef.current = null;
	}, [editor]);

	// Detect trigger character as user types
	useEffect(() => {
		return editor.registerTextContentListener(() => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					setIsOpen(false);
					isExplicitlyClosedRef.current = false;
					return;
				}

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();
				if (!$isTextNode(anchorNode)) {
					setIsOpen(false);
					isExplicitlyClosedRef.current = false;
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
					if (isNewTrigger) isExplicitlyClosedRef.current = false;

					if (!isExplicitlyClosedRef.current) {
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
					isExplicitlyClosedRef.current = false;
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
				isExplicitlyClosedRef.current = true;
				setIsOpen(false);
				editor.focus(() => null, { defaultSelection: "rootEnd" });
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

	// closing from the menu keeps it closed until a new trigger is typed
	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open && isOpen) isExplicitlyClosedRef.current = true;
			setIsOpen(open);
		},
		[isOpen],
	);

	if (!isOpen || !menuPosition) return null;

	return renderMenu({
		isOpen: isOpen,
		onOpenChange: handleOpenChange,
		menuPosition: menuPosition,
		addToken: addToken,
		addNode: addNode,
		onRequestClose: handleRequestClose,
		query: query,
		selectedIndex: selectedIndex,
		onItemCountChange: handleItemCountChange,
		onSelectedIndexChange: handleSelectedIndexChange,
	});
};
