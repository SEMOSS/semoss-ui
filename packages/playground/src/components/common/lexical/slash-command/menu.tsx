import type React from "react";
import { useEffect, useRef } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@semoss/ui/next";
import { useSlashCommands } from "./context";
import type { SlashCommand } from "./types";

// ============================================================================
// Filter
// ============================================================================

export const filterSlashCommands = (
	commands: SlashCommand[],
	query: string,
): SlashCommand[] => {
	const lowerQuery = query.toLowerCase();
	return commands.filter((cmd) => {
		if (!cmd.id.toLowerCase().startsWith(lowerQuery)) return false;
		if (cmd.hiddenInMenu && lowerQuery.length < 1) return false;
		return true;
	});
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
 * inside a SlashCommandProvider). Filters by the text typed after "/".
 * Arrow keys highlight items; Enter or click executes the selected command.
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
			<CommandList ref={listRef}>
				{filtered.length === 0 ? (
					<CommandEmpty>No commands found</CommandEmpty>
				) : (
					<CommandGroup>
						{filtered.map((cmd) => {
							const Icon = cmd.icon;
							const disabled = !!(
								cmd.disableWithTools &&
								(isLoading || hasTools)
							);
							return (
								<CommandItem
									key={cmd.id}
									value={cmd.id}
									disabled={disabled}
									onSelect={() => {
										if (disabled) return;
										if (onCommandSelect) {
											onCommandSelect(cmd);
										} else {
											cmd.onExecute();
											onRequestClose();
										}
									}}
								>
									<Icon className="mr-2 size-4 shrink-0" />
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-sm">
											{cmd.label}
										</span>
										<span className="text-muted-foreground text-xs">
											{cmd.description}
										</span>
									</div>
								</CommandItem>
							);
						})}
					</CommandGroup>
				)}
			</CommandList>
		</Command>
	);
};
