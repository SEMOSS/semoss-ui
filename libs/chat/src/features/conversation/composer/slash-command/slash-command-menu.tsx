import type React from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import { Command, CommandEmpty, CommandList } from "@semoss/ui/next";
import { useSlashCommands } from "./slash-command.context";
import {
	SLASH_COMMAND_GROUPS,
	type SlashCommandEntry,
} from "./slash-command-entry";
import { SlashCommandMenuGroup } from "./slash-command-menu-group";

/** How many prompts the menu lists before anything is typed. */
const PROMPT_PREVIEW_COUNT = 5;

/** Splits a name into the words a query can start. */
const WORD_PATTERN = /[\s\-_/]+/;

/**
 * How well a command matches the query: 0 when its id, label, or a keyword
 * starts with it, 1 when one of their words does, 2 when one contains it, and
 * -1 when none do.
 *
 * @param cmd - The command.
 * @param query - The lowercased, trimmed query.
 * @returns The rank; lower is closer.
 */
const rankSlashCommand = (cmd: SlashCommandEntry, query: string): number => {
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
 * Before anything is typed it lists every command, with only the first few
 * prompts.
 *
 * @param commands - The composer's commands.
 * @param query - What was typed after "/".
 * @returns The commands to list, in the order the menu shows them.
 */
export const filterSlashCommands = (
	commands: SlashCommandEntry[],
	query: string,
): SlashCommandEntry[] => {
	const lowerQuery = query.trim().toLowerCase();
	const ranked = commands.flatMap((cmd, index) => {
		if (!lowerQuery) return [{ cmd, rank: 0, index }];
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

/** Props for {@link SlashCommandMenu}. */
interface SlashCommandMenuProps {
	/** Text typed after the "/" trigger, used to filter commands */
	query: string;
	/** Index of the currently highlighted command */
	selectedIndex: number;
	/** Reports the current filtered item count back to the parent */
	onItemCountChange: (count: number) => void;
	/** Syncs hover / cmdk-driven selection back to the parent */
	onSelectedIndexChange: (index: number) => void;
	/** Runs a command picked by click or keyboard, and closes the menu. */
	onCommandSelect: (cmd: SlashCommandEntry) => void;
	/** Whether commands locked while busy are disabled. */
	isBusy: boolean;
}

/**
 * The slash command palette. Reads the commands from `SlashCommandProvider`,
 * filters them by the text typed after "/", and lists the matches under their
 * groups' headings. Arrow keys highlight items; Enter or click runs one.
 */
export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
	query,
	selectedIndex,
	onItemCountChange,
	onSelectedIndexChange,
	onCommandSelect,
	isBusy,
}) => {
	const { t } = useTranslation("room");
	const { commands } = useSlashCommands();
	const filtered = filterSlashCommands(commands, query);

	const listRef = useRef<HTMLDivElement>(null);

	// the editor's arrow keys move the highlight, so they need the count
	useEffect(() => {
		onItemCountChange(filtered.length);
	}, [filtered.length, onItemCountChange]);

	// keep the highlighted item in view as the arrow keys move it
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
				if (idx !== -1) onSelectedIndexChange(idx);
			}}
			className="w-full"
		>
			<CommandList ref={listRef} className="max-h-80">
				{filtered.length === 0 ? (
					<CommandEmpty>{t("slash.empty")}</CommandEmpty>
				) : (
					groups.map(({ group, items }) => (
						<SlashCommandMenuGroup
							key={group}
							group={group}
							items={items}
							isBusy={isBusy}
							onSelect={onCommandSelect}
						/>
					))
				)}
			</CommandList>
		</Command>
	);
};
