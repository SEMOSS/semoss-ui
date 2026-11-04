import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@semoss/ui/next";
import { useSlashCommands } from "./context";
import {
	SLASH_COMMAND_GROUPS,
	type SlashCommand,
	type SlashCommandGroup,
} from "./types";

// ============================================================================
// Filter
// ============================================================================

/** How many prompts the menu lists before anything is typed. */
const PROMPT_PREVIEW_COUNT = 5;

/** Splits a name into the words a query can start. */
const WORD_PATTERN = /[\s\-_/]+/;

/**
 * How well a command matches the query: 0 when its id, label, or a keyword
 * starts with it, 1 when one of their words does, 2 when one contains it, and
 * -1 when none do.
 */
const rankSlashCommand = (cmd: SlashCommand, query: string): number => {
	const terms = [cmd.id, cmd.label, ...(cmd.keywords ?? [])].map((term) =>
		term.toLowerCase(),
	);
	if (terms.some((term) => term.startsWith(query))) return 0;
	if (
		terms.some((term) =>
			term.split(WORD_PATTERN).some((word) => word.startsWith(query)),
		)
	)
		return 1;
	if (terms.some((term) => term.includes(query))) return 2;
	return -1;
};

/**
 * The commands the menu lists for a query, by group in
 * {@link SLASH_COMMAND_GROUPS} order, the closest matches first within each.
 * Before anything is typed it lists every command not hidden, with only the
 * first few prompts.
 *
 * @param commands - The composer's commands.
 * @param query - What was typed after "/".
 * @return The commands to list, in the order the menu shows them.
 */
export const filterSlashCommands = (
	commands: SlashCommand[],
	query: string,
): SlashCommand[] => {
	const lowerQuery = query.trim().toLowerCase();
	const ranked = commands.flatMap((cmd, index) => {
		if (!lowerQuery)
			return cmd.hiddenInMenu ? [] : [{ cmd, rank: 0, index }];
		const rank = rankSlashCommand(cmd, lowerQuery);
		return rank < 0 ? [] : [{ cmd, rank, index }];
	});
	// ranked is this call's own array, so sorting it in place is safe
	const sorted = ranked
		.sort(
			(first, second) =>
				SLASH_COMMAND_GROUPS.indexOf(first.cmd.group) -
					SLASH_COMMAND_GROUPS.indexOf(second.cmd.group) ||
				first.rank - second.rank ||
				first.index - second.index,
		)
		.map(({ cmd }) => cmd);
	if (lowerQuery) return sorted;
	let promptCount = 0;
	return sorted.filter(
		(cmd) =>
			cmd.group !== "prompts" || promptCount++ < PROMPT_PREVIEW_COUNT,
	);
};

// ============================================================================
// Component
// ============================================================================

interface RoomInputMenuSlashProps {
	/** Text typed after the "/" trigger, used to filter commands */
	query: string;
	/** Index of the currently highlighted command */
	selectedIndex: number;
	/** Reports the current filtered item count back to the parent */
	setItemCount: (count: number) => void;
	/** Syncs hover / cmdk-driven selection back to the parent */
	setSelectedIndex: (index: number) => void;
	/** Removes the slash + query text from the editor and closes the menu */
	onRequestClose: () => void;
	/**
	 * Called when a command is selected by click or keyboard. When provided,
	 * the caller is responsible for executing the command and closing the menu.
	 */
	onCommandSelect?: (cmd: SlashCommand) => void;
	/** When true, commands with disableWithTools are shown as disabled */
	isLoading?: boolean;
	/** When true, commands with disableWithTools are shown as disabled */
	hasTools?: boolean;
}

/**
 * RoomInputMenuSlash – slash command palette
 *
 * Reads the available commands from SlashCommandContext (must be rendered
 * inside a SlashCommandProvider). Filters by the text typed after "/" and
 * lists the matches under their groups' headings. Arrow keys highlight items;
 * Enter or click executes the selected command.
 */
export const RoomInputMenuSlash: React.FC<RoomInputMenuSlashProps> = ({
	query,
	selectedIndex,
	setItemCount,
	setSelectedIndex,
	onRequestClose,
	onCommandSelect,
	isLoading,
	hasTools,
}) => {
	const { t } = useTranslation("room");
	const { commands } = useSlashCommands();
	const filtered = filterSlashCommands(commands, query);

	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setItemCount(filtered.length);
	}, [filtered.length, setItemCount]);

	useEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const items = list.querySelectorAll("[cmdk-item]");
		(items[selectedIndex] as HTMLElement | undefined)?.scrollIntoView({
			block: "nearest",
		});
	}, [selectedIndex]);

	// the menu lists the filtered commands in order, one group after another
	const groups = SLASH_COMMAND_GROUPS.flatMap((group) => {
		const items = filtered.filter((cmd) => cmd.group === group);
		return items.length > 0 ? [{ group, items }] : [];
	});

	return (
		<Command
			shouldFilter={false}
			value={filtered[selectedIndex]?.id ?? ""}
			onValueChange={(val) => {
				const idx = filtered.findIndex((cmd) => cmd.id === val);
				if (idx !== -1) setSelectedIndex(idx);
			}}
			className="w-full"
		>
			<CommandList ref={listRef} className="max-h-80">
				{filtered.length === 0 ? (
					<CommandEmpty>{t("slash.empty")}</CommandEmpty>
				) : (
					groups.map(({ group, items }) => (
						<SlashCommandGroupItems
							key={group}
							group={group}
							items={items}
							isBusy={Boolean(isLoading || hasTools)}
							onSelect={(cmd) => {
								if (onCommandSelect) {
									onCommandSelect(cmd);
								} else {
									cmd.onExecute();
									onRequestClose();
								}
							}}
						/>
					))
				)}
			</CommandList>
		</Command>
	);
};

interface SlashCommandGroupItemsProps {
	/** The group. */
	group: SlashCommandGroup;
	/** Its commands, in the order the menu lists them. */
	items: SlashCommand[];
	/** Whether commands with disableWithTools are disabled. */
	isBusy: boolean;
	/** Runs a command the user picked. */
	onSelect: (cmd: SlashCommand) => void;
}

/** One group of the slash menu under its heading. */
const SlashCommandGroupItems = ({
	group,
	items,
	isBusy,
	onSelect,
}: SlashCommandGroupItemsProps) => {
	const { t } = useTranslation("room");
	return (
		<CommandGroup heading={t(`slash.groups.${group}`)}>
			{items.map((cmd) => {
				const disabled = Boolean(cmd.disableWithTools && isBusy);
				return (
					<CommandItem
						key={cmd.id}
						value={cmd.id}
						disabled={disabled}
						onSelect={() => {
							if (!disabled) onSelect(cmd);
						}}
						className="gap-2 max-md:min-h-11"
					>
						<span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4">
							{cmd.icon}
						</span>
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="truncate font-medium text-sm">
								{cmd.label}
							</span>
							{cmd.description && (
								<span className="truncate text-muted-foreground text-xs">
									{cmd.description}
								</span>
							)}
						</div>
					</CommandItem>
				);
			})}
		</CommandGroup>
	);
};
