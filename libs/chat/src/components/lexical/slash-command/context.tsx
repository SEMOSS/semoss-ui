import type React from "react";
import { createContext, useContext } from "react";
import type { SlashCommand } from "./types";

export interface SlashCommandContextValue {
	/** Full list of available commands (after any exclusion filtering) */
	commands: SlashCommand[];
}

const SlashCommandContext = createContext<SlashCommandContextValue>({
	commands: [],
});

/** Returns the current slash command list from context */
export const useSlashCommands = (): SlashCommandContextValue =>
	useContext(SlashCommandContext);

export interface SlashCommandProviderProps {
	/** Every command the composer offers. */
	commands: SlashCommand[];
	/** Command IDs to suppress */
	excludeCommandIds?: string[];
	/** The composer, whose slash menu reads the commands. */
	children: React.ReactNode;
}

/**
 * Provides the slash command list to all descendants. Wrap around
 * LexicalComposer so the menu can reach commands via useSlashCommands().
 */
export const SlashCommandProvider: React.FC<SlashCommandProviderProps> = ({
	commands: all,
	excludeCommandIds,
	children,
}) => {
	const commands = excludeCommandIds?.length
		? all.filter((cmd) => !excludeCommandIds.includes(cmd.id))
		: all;
	return (
		<SlashCommandContext.Provider value={{ commands }}>
			{children}
		</SlashCommandContext.Provider>
	);
};
