import {
	BookOpenIcon,
	BotIcon,
	FlaskConicalIcon,
	HammerIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@semoss/ui/next";

// ============================================================================
// Types
// ============================================================================

export interface SlashCommand {
	id: string;
	label: string;
	description?: string;
	icon: React.ComponentType<{ className?: string }>;
	onExecute: () => void;
	/** If true, the command is hidden until at least 2 characters of its id are typed */
	hiddenInMenu?: boolean;
}

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
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Slash commands that open the MCP overlay are defined in room-input.tsx
 * (where handleOpenMcpOverlay is in scope) and injected via buildSlashCommands.
 * Test commands are defined inline here.
 */
const TEST_COMMANDS: SlashCommand[] = ["A", "B", "C", "D", "E", "F"].map(
	(letter) => ({
		id: `test${letter}`,
		label: `/test${letter}`,
		description: `Test command ${letter}`,
		icon: FlaskConicalIcon,
		onExecute: () => console.log(`test${letter}`),
	}),
);

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

export const buildSlashCommands = (
	onOpenMcpOverlay: (tab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") => void,
): SlashCommand[] => [
	{
		id: "knowledge",
		label: "/knowledge",
		description: "Add knowledge sources to this conversation",
		icon: BookOpenIcon,
		onExecute: () => onOpenMcpOverlay("KNOWLEDGE"),
	},
	{
		id: "toolbox",
		label: "/toolbox",
		description: "Add toolboxes to this conversation",
		icon: HammerIcon,
		onExecute: () => onOpenMcpOverlay("TOOLBOX"),
	},
	{
		id: "mcp",
		label: "/mcp",
		icon: HammerIcon,
		onExecute: () => onOpenMcpOverlay("TOOLBOX"),
		hiddenInMenu: true,
	},
	{
		id: "agent",
		label: "/agent",
		description: "Select an agent for this conversation",
		icon: BotIcon,
		onExecute: () => onOpenMcpOverlay("AGENT"),
	},
	{
		id: "workspace",
		label: "/workspace",
		icon: BotIcon,
		onExecute: () => onOpenMcpOverlay("AGENT"),
		hiddenInMenu: true,
	},
	...TEST_COMMANDS,
];

// ============================================================================
// Component
// ============================================================================

/**
 * RoomInputMenuSlash - Preset slash command list
 *
 * Filters the static command list by the text typed after "/". Arrow keys
 * highlight items; Enter or click executes the selected command.
 */
export const RoomInputMenuSlash: React.FC<
	RoomInputMenuSlashProps & { commands: SlashCommand[] }
> = ({
	query,
	selectedIndex,
	setItemCount,
	setSelectedIndex,
	onRequestClose,
	onCommandSelect,
	commands,
}) => {
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
			// Drive cmdk's highlighted item from our selectedIndex so that both
			// arrow-key nav and hover go through the same data-selected path.
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
							return (
								<CommandItem
									key={cmd.id}
									value={cmd.id}
									onSelect={() => {
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
