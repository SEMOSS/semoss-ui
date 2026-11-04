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
// Provider
// ============================================================================

export interface SlashCommandProviderProps {
	/** Every command the composer offers. */
	commands: SlashCommand[];
	/** Command IDs to suppress */
	excludeCommandIds?: string[];
	children: React.ReactNode;
}

/**
 * Provides the slash command list (plus its click registry) to all
 * descendants. Wrap around LexicalComposer so chips and the menu can reach
 * commands via useSlashCommands().
 */
export const SlashCommandProvider: React.FC<SlashCommandProviderProps> = ({
	commands: all,
	excludeCommandIds,
	children,
}) => {
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
