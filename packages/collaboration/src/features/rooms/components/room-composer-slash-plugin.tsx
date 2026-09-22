import {
	LexicalTypeaheadMenuPlugin,
	MenuOption,
	useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
	$createTextNode,
	$getRoot,
	COMMAND_PRIORITY_HIGH,
	type TextNode,
} from "lexical";
import { type ComponentType, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@semoss/ui/next";

export interface RoomSlashCommand {
	id: "document" | "optimize";
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	disabled?: boolean;
	onSelect: (text: string) => void;
}

class SlashOption extends MenuOption {
	readonly command: RoomSlashCommand;

	constructor(command: RoomSlashCommand) {
		super(command.id);
		this.command = command;
	}
}

/** Lexical typeahead containing collaboration's attachment and optimize actions. */
export function RoomComposerSlashPlugin({
	commands,
}: {
	commands: RoomSlashCommand[];
}) {
	const trigger = useBasicTypeaheadTriggerMatch("/", {
		minLength: 0,
		maxLength: 24,
		allowWhitespace: false,
	});
	const [query, setQuery] = useState("");
	const options = useMemo(
		() =>
			commands
				.filter((command) => command.id.startsWith(query))
				.map((command) => new SlashOption(command)),
		[commands, query],
	);

	return (
		<LexicalTypeaheadMenuPlugin<SlashOption>
			commandPriority={COMMAND_PRIORITY_HIGH}
			triggerFn={trigger}
			options={options}
			onQueryChange={(nextQuery) =>
				setQuery(nextQuery?.toLowerCase() ?? "")
			}
			onSelectOption={(
				option,
				textNodeContainingQuery: TextNode | null,
				closeMenu,
			) => {
				if (option.command.disabled) return;
				textNodeContainingQuery?.replace($createTextNode(""));
				const text = $getRoot().getTextContent();
				closeMenu();
				queueMicrotask(() => option.command.onSelect(text));
			}}
			menuRenderFn={(anchorRef, menu) =>
				anchorRef.current
					? createPortal(
							<div className="z-50 w-72 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
								{menu.options.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No commands found
									</div>
								) : (
									menu.options.map((option, index) => {
										const command = option.command;
										const Icon = command.icon;
										return (
											<button
												key={command.id}
												ref={option.setRefElement.bind(
													option,
												)}
												type="button"
												role="option"
												aria-selected={
													menu.selectedIndex === index
												}
												disabled={command.disabled}
												className={cn(
													"flex w-full items-start gap-2 rounded-sm px-3 py-2 text-start hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
													menu.selectedIndex ===
														index && "bg-accent",
												)}
												onMouseEnter={() =>
													menu.setHighlightedIndex(
														index,
													)
												}
												onClick={() =>
													menu.selectOptionAndCleanUp(
														option,
													)
												}
											>
												<Icon
													aria-hidden="true"
													className="mt-0.5 size-4 shrink-0"
												/>
												<span>
													<span className="block font-medium text-sm">
														{command.label}
													</span>
													<span className="block text-muted-foreground text-xs">
														{command.description}
													</span>
												</span>
											</button>
										);
									})
								)}
							</div>,
							anchorRef.current,
						)
					: null
			}
		/>
	);
}
