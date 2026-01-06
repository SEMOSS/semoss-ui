import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical";
import { useEffect, useRef, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverAnchor,
	PopoverContent,
	Spinner,
} from "@semoss/ui/next";

export interface Mention<D> {
	display: string;
	value: string;
	data?: D;
}

interface MentionPluginProps<D> {
	/**
	 * Trigger character to open the mention menu
	 */
	trigger: string;

	/**
	 * Callback to search for mentions
	 * @param search
	 * @returns list of mentions that match the search
	 */
	onSearch: (search: string) => Promise<Mention<D>[]>;

	/**
	 * Callback to select a mention
	 * @param triggerIdx - location of the trigger character
	 * @param selected mention
	 * @returns true if the mention was selected, false otherwise
	 */
	onSelect: (triggerIdx: number, selected: Mention<D>) => boolean;
}

export function MentionPlugin<D>({
	trigger,
	onSearch,
	onSelect,
}: MentionPluginProps<D>) {
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [items, setItems] = useState<Mention<D>[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedValue, setSelectedValue] = useState("");
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);

	const triggerOffsetRef = useRef<number | null>(null);

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

	// focus on the menu when closed
	useEffect(() => {
		if (isOpen) {
			return;
		}
		editor.focus(() => null, {
			defaultSelection: "rootEnd",
		});
	}, [editor, isOpen]);

	if (!isOpen || !menuPosition) {
		return null;
	}

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverAnchor
				style={{
					position: "fixed",
					top: menuPosition.top,
					left: menuPosition.left,
				}}
			/>
			<PopoverContent className="w-72 p-0" align="start">
				<Command
					shouldFilter={false}
					value={selectedValue}
					onValueChange={setSelectedValue}
				>
					<CommandInput
						placeholder="Search"
						value={search}
						onValueChange={setSearch}
					/>
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
								onSelect={() => {
									const success = onSelect(
										triggerOffsetRef.current,
										item,
									);

									if (success) {
										setIsOpen(false);
										setSearch("");
										triggerOffsetRef.current = null;
									}
								}}
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
