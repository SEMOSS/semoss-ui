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
import { Button, cn, Small } from "@semoss/ui/next";
import { RoomComposerSlashMenu } from "./room-composer-slash-menu";

export interface RoomSlashCommand {
	/** Stable command identity, including host-owned shortcuts. */
	id: string;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	disabled?: boolean;
	/** Puts this text where the slash token was, for a command the user finishes by typing; onSelect does not run. */
	insertText?: string;
	onSelect: (text: string) => void;
}

class SlashOption extends MenuOption {
	readonly command: RoomSlashCommand;

	constructor(command: RoomSlashCommand) {
		super(command.id);
		this.command = command;
	}
}

/** Lexical typeahead containing the composer’s available actions. */
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
				const { insertText } = option.command;
				if (insertText) {
					const inserted = $createTextNode(insertText);
					textNodeContainingQuery?.replace(inserted);
					inserted.selectEnd();
					closeMenu();
					return;
				}
				textNodeContainingQuery?.replace($createTextNode(""));
				const text = $getRoot().getTextContent();
				closeMenu();
				queueMicrotask(() => option.command.onSelect(text));
			}}
			menuRenderFn={(anchorRef, menu) =>
				anchorRef.current
					? createPortal(
							<RoomComposerSlashMenu anchor={anchorRef.current}>
								{menu.options.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No commands found
									</div>
								) : (
									menu.options.map((option, index) => {
										const command = option.command;
										const Icon = command.icon;
										return (
											<Button
												key={command.id}
												id={`typeahead-item-${index}`}
												variant="ghost"
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
													"h-auto min-h-11 w-full items-start justify-start whitespace-normal rounded-sm px-3 py-2 text-start",
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
													<Small className="block">
														{command.label}
													</Small>
													<Small className="block font-normal text-muted-foreground">
														{command.description}
													</Small>
												</span>
											</Button>
										);
									})
								)}
							</RoomComposerSlashMenu>,
							anchorRef.current,
						)
					: null
			}
		/>
	);
}
