import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	TextNode,
} from "lexical";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverAnchor,
	PopoverContent,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { engineProjectToMCP } from "@/components";
import { useRoot } from "@/hooks";
import type { RoomStore } from "@/stores";
import type { App, Engine, MCPConfig } from "@/types";

const TRIGGER = "/";

interface RoomInputMenuPluginProps {
	/**
	 * Options
	 */
	options: RoomStore["options"];

	/**
	 * Update the options
	 * @param options
	 * @returns
	 */
	setOptions: (options: RoomStore["options"]) => void;
}

export const RoomInputMenuPlugin: React.FC<RoomInputMenuPluginProps> = ({
	options,
	setOptions,
}) => {
	const { root } = useRoot();
	const [editor] = useLexicalComposerContext();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [selectedValue, setSelectedValue] = useState("");
	const [menuPosition, setMenuPosition] = useState<{
		top: number;
		left: number;
	} | null>(null);

	const triggerOffsetRef = useRef<number | null>(null);

	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Get all of the toolboxes with lazy loading
	 */
	const getToolbox = useIteratorPixel<(App | Engine)[], MCPConfig>(
		(limit, offset) =>
			`MyEngineProject (metaKeys = ["tag", "description"], metaFilters=[{"tag":["MCP"]}], type=["PROJECT", "STORAGE", "DATABASE", "FUNCTION"], ${debouncedSearch ? `filterWord=${JSON.stringify(debouncedSearch)}, ` : ""}limit=[${limit}], offset=[${offset}])`,
		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 15) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response.map(engineProjectToMCP);
		},
		{
			limit: 15,
		},
		[open, debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getToolbox.isLoading || !getToolbox.hasMore || !open,
		onNext: () => {
			getToolbox.next();
		},
	});

	// track the selected tools
	const tools = options.mcp.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, MCPConfig>,
	);

	// track the defaults based on the search
	const defaultTools = (root.theme.defaultTools || []).filter(
		(t) =>
			t.name.toLowerCase().indexOf(debouncedSearch.toLowerCase()) !== -1,
	);

	/**
	 *
	 * @param tool
	 * @returns
	 */
	const onSelect = (tool: MCPConfig) => {
		const triggerIdx = triggerOffsetRef.current;
		if (triggerIdx === null) {
			return false;
		}
		// copy for react
		const updated = {
			...tools,
		};

		let isAdded = false;
		if (Object.hasOwn(updated, tool.id)) {
			// remove it
			delete updated[tool.id];
		} else {
			// add it
			updated[tool.id] = tool;
			isAdded = true;
		}

		// set the options
		setOptions({
			...options,
			mcp: Object.values(updated),
		});

		// update the node
		if (isAdded) {
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
				const textNode = $createTextNode(`<${tool.name}>`);

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
		}

		setIsOpen(false);
		setSearch("");
		triggerOffsetRef.current = null;
	};

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
					if (text[i] === TRIGGER) {
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
	}, [editor]);

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
					<CommandList
						className="max-h-[200px]"
						ref={(ele) => setScroll(ele)}
					>
						{!getToolbox.isLoading &&
						getToolbox.data.length === 0 &&
						defaultTools.length === 0 ? (
							<CommandEmpty>Not Found</CommandEmpty>
						) : null}

						{!getToolbox.isLoading && defaultTools.length > 0 && (
							<CommandGroup>
								{defaultTools.map((item) => (
									<CommandItem
										key={item.id}
										value={item.id}
										onSelect={() => {
											onSelect(item);
										}}
									>
										{item.name}
										<CheckIcon
											className={`ml-auto ${tools[item.id] ? "opacity-100" : "opacity-0"}`}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						)}

						{!getToolbox.isLoading &&
							getToolbox.data.length > 0 && (
								<CommandGroup heading="All Tools">
									{getToolbox.data.map((item) => (
										<CommandItem
											key={item.id}
											value={item.id}
											onSelect={() => {
												onSelect({
													type: item.type,
													id: item.id,
													name: item.name,
												});
											}}
										>
											{item.name}
											<CheckIcon
												className={`ml-auto ${tools[item.id] ? "opacity-100" : "opacity-0"}`}
											/>
										</CommandItem>
									))}
								</CommandGroup>
							)}

						{getToolbox.isLoading && (
							<div className="flex items-center justify-center py-4">
								<Spinner className="size-4" />
							</div>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
