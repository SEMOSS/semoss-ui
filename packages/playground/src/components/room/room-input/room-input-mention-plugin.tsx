import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_HIGH,
	KEY_ENTER_COMMAND,
	KEY_ESCAPE_COMMAND,
	TextNode,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandItem,
	CommandList,
	Popover,
	PopoverAnchor,
	PopoverContent,
	Spinner,
} from "@semoss/ui/next";
import { $createMentionNode } from "./room-input-mention-node";

interface MentionItem {
	display: string;
	value: string;
}

interface RoomInputMentionPluginProps {
	trigger?: string;
	onSearch: (search: string) => Promise<MentionItem[]>;
}

export function RoomInputMentionPlugin({
	trigger = "/",
	onSearch,
}: RoomInputMentionPluginProps) {
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [items, setItems] = useState<MentionItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedValue, setSelectedValue] = useState("");
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);

	const menuRef = useRef<HTMLDivElement>(null);
	const triggerOffsetRef = useRef<number | null>(null);
	const itemsRef = useRef<MentionItem[]>([]);
	const selectedValueRef = useRef<string>("");

	// Keep refs in sync with state
	useEffect(() => {
		itemsRef.current = items;
	}, [items]);

	useEffect(() => {
		selectedValueRef.current = selectedValue;
	}, [selectedValue]);

	// Search for items when search text changes
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		let cancelled = false;
		setIsLoading(true);

		onSearch(search)
			.then((results) => {
				if (!cancelled) {
					setItems(results);
					// Select first item by default
					if (results.length > 0) {
						setSelectedValue(results[0].value);
					} else {
						setSelectedValue("");
					}
				}
			})
			.catch((error) => {
				console.error("Mention search error:", error);
				if (!cancelled) {
					setItems([]);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [isOpen, search, onSearch]);

	// Insert the selected mention
	const insertMention = useCallback(
		(item: MentionItem) => {
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
				const triggerIndex = triggerOffsetRef.current;

				if (triggerIndex === null) {
					return;
				}

				// Get text before trigger
				const textBeforeTrigger = textContent.slice(0, triggerIndex);
				// Get text after cursor
				const textAfterCursor = textContent.slice(anchor.offset);

				// Create mention node
				const mentionNode = $createMentionNode(
					trigger,
					item.display,
					item.value,
				);

				// Update the text node
				if (textBeforeTrigger) {
					anchorNode.setTextContent(textBeforeTrigger);
					anchorNode.insertAfter(mentionNode);
				} else {
					anchorNode.replace(mentionNode);
				}

				// Add text after cursor if any
				if (textAfterCursor) {
					const textNode = new TextNode(textAfterCursor);
					mentionNode.insertAfter(textNode);
				}

				// Add a space after the mention and move selection there
				const spaceNode = new TextNode(" ");
				mentionNode.insertAfter(spaceNode);
				spaceNode.select();
			});

			setIsOpen(false);
			setSearch("");
			triggerOffsetRef.current = null;
		},
		[trigger, editor],
	);

	// Handle text changes to detect trigger
	useEffect(() => {
		return editor.registerTextContentListener(() => {
			editor.getEditorState().read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection)) {
					setIsOpen(false);
					return;
				}

				const anchor = selection.anchor;
				const anchorNode = anchor.getNode();

				if (!$isTextNode(anchorNode)) {
					setIsOpen(false);
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
					const searchText = text.slice(
						triggerIndex + 1,
						cursorOffset,
					);

					// Don't show menu if there's a space in the search (completed mention)
					if (/\s/.test(searchText)) {
						setIsOpen(false);
						return;
					}

					triggerOffsetRef.current = triggerIndex;
					setSearch(searchText);
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
				} else {
					setIsOpen(false);
					triggerOffsetRef.current = null;
				}
			});
		});
	}, [editor, trigger]);

	// Handle escape key to close menu
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				setIsOpen(false);
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isOpen]);

	// Handle Enter key to select item
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event) => {
				if (event) {
					event.preventDefault();
				}
				const currentItems = itemsRef.current;
				const currentSelectedValue = selectedValueRef.current;
				const selectedItem = currentItems.find(
					(item) => item.value === currentSelectedValue,
				);
				if (selectedItem) {
					insertMention(selectedItem);
				}
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, isOpen, insertMention]);

	if (!isOpen || !menuPosition) {
		return null;
	}

	return (
		<Popover open={isOpen}>
			<PopoverAnchor
				style={{
					position: "fixed",
					top: menuPosition.top,
					left: menuPosition.left,
				}}
			/>
			<PopoverContent ref={menuRef} className="w-72 p-0" align="start">
				<Command
					shouldFilter={false}
					value={selectedValue}
					onValueChange={setSelectedValue}
				>
					<CommandList>
						<CommandEmpty>
							{isLoading ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							) : (
								"Not Found"
							)}
						</CommandEmpty>
						{items.map((item) => (
							<CommandItem
								key={item.value}
								value={item.value}
								onSelect={() => insertMention(item)}
							>
								{item.display}
							</CommandItem>
						))}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
