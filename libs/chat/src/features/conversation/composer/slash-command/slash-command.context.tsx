import type React from "react";
import { createContext, useContext } from "react";
import type { SlashCommand } from "./slash-command";

/** What {@link useSlashCommands} reads. */
interface SlashCommandContextValue {
	/** Every command offered, after `excludeCommandIds` is applied. */
	commands: SlashCommand[];
}

/** The composer's slash commands; empty outside a provider. */
const SlashCommandContext = createContext<SlashCommandContextValue>({
	commands: [],
});

/**
 * Read the composer's slash commands.
 *
 * @returns The commands the slash menu lists.
 */
export const useSlashCommands = (): SlashCommandContextValue =>
	useContext(SlashCommandContext);

/** Props for {@link SlashCommandProvider}. */
interface SlashCommandProviderProps {
	/** Every command the composer offers. */
	commands: SlashCommand[];
	/** Ids of commands to leave out. */
	excludeCommandIds?: string[];
	/** The composer, whose slash menu reads the commands. */
	children: React.ReactNode;
}

/**
 * Provides the slash command list to all descendants. Wrap it around the
 * `LexicalComposer` so the menu can reach the commands through
 * `useSlashCommands()`.
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
