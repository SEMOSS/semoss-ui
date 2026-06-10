import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	HammerIcon,
	PaperclipIcon,
	Settings2Icon,
} from "lucide-react";
import type React from "react";
import { createContext, useContext } from "react";
import type { SlashCommand } from "./types";

// ============================================================================
// Context
// ============================================================================

export interface SlashCommandContextValue {
	/** Full list of available commands (after any exclusion filtering) */
	commands: SlashCommand[];
	/** commandId → onExecute map, used by chips to re-trigger actions on click */
	registry: Map<string, () => void>;
}

const SlashCommandContext = createContext<SlashCommandContextValue>({
	commands: [],
	registry: new Map(),
});

// ============================================================================
// Hooks
// ============================================================================

/** Returns the current slash command list and click registry from context */
export const useSlashCommands = (): SlashCommandContextValue =>
	useContext(SlashCommandContext);

// ============================================================================
// Command builder (internal)
// ============================================================================

const buildSlashCommands = (
	onOpenMcpOverlay: (tab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") => void,
	onCompact: () => void,
	onAttachDocument: () => void,
	onOpenSettings: () => void,
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
	{
		id: "compact",
		label: "/compact",
		description: "Summarize conversation history to free up context",
		icon: ChevronsDownUpIcon,
		noChip: true,
		onExecute: onCompact,
	},
	{
		id: "document",
		label: "/document",
		description: "Attach a document to this message",
		icon: PaperclipIcon,
		onExecute: onAttachDocument,
	},
	{
		id: "file",
		label: "/file",
		icon: PaperclipIcon,
		onExecute: onAttachDocument,
		hiddenInMenu: true,
	},
	{
		id: "settings",
		label: "/settings",
		description: "Open room configuration",
		icon: Settings2Icon,
		noChip: true,
		onExecute: onOpenSettings,
	},
	{
		id: "room-options",
		label: "/room-options",
		icon: Settings2Icon,
		noChip: true,
		onExecute: onOpenSettings,
		hiddenInMenu: true,
	},
];

// ============================================================================
// Provider
// ============================================================================

export interface SlashCommandProviderProps {
	onOpenMcpOverlay: (tab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") => void;
	onCompact: () => void;
	onAttachDocument: () => void;
	onOpenSettings: () => void;
	/** Command IDs to suppress */
	excludeCommandIds?: string[];
	children: React.ReactNode;
}

/**
 * Builds the slash command list and provides it (plus its click registry) to
 * all descendants. Wrap around LexicalComposer so chips and the menu can
 * reach commands via useSlashCommands() / useSlashCommandRegistry().
 */
export const SlashCommandProvider: React.FC<SlashCommandProviderProps> = ({
	onOpenMcpOverlay,
	onCompact,
	onAttachDocument,
	onOpenSettings,
	excludeCommandIds,
	children,
}) => {
	const all = buildSlashCommands(
		onOpenMcpOverlay,
		onCompact,
		onAttachDocument,
		onOpenSettings,
	);
	const commands = excludeCommandIds?.length
		? all.filter((cmd) => !excludeCommandIds.includes(cmd.id))
		: all;
	const registry = new Map(commands.map((cmd) => [cmd.id, cmd.onExecute]));

	return (
		<SlashCommandContext.Provider value={{ commands, registry }}>
			{children}
		</SlashCommandContext.Provider>
	);
};
