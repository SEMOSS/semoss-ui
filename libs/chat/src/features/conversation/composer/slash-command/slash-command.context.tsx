import type React from "react";
import { createContext, useContext } from "react";
import type { StoreState } from "@semoss/utility/store";
import type { SlashCommandEntry } from "./slash-command-entry";

/** What {@link useSlashCommands} reads. */
interface SlashCommandContextValue {
	/** Every command offered, in the order the composer lists them. */
	commands: SlashCommandEntry[];
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
	commands: SlashCommandEntry[];
	/** The composer, whose slash menu reads the commands. */
	children: React.ReactNode;
}

/**
 * Provides the slash command list to all descendants. Wrap it around the
 * `LexicalComposer` so the menu can reach the commands through
 * `useSlashCommands()`.
 */
export const SlashCommandProvider: React.FC<SlashCommandProviderProps> = ({
	commands,
	children,
}) => (
	<SlashCommandContext.Provider value={{ commands }}>
		{children}
	</SlashCommandContext.Provider>
);

/** One command a `SlashCommand` registered, and where it is in the page. */
export interface RegisteredSlashCommand {
	/** The command. */
	readonly entry: SlashCommandEntry;
	/** The command's place among the others: the menu lists them in this order. */
	readonly marker: HTMLElement;
}

/** The commands the composer's "/" slot registers, by each one's own key. */
export type SlashCommandRegistry = StoreState<
	ReadonlyMap<string, RegisteredSlashCommand>
>;

/** Where a `SlashCommand` registers itself; null outside the composer. */
export const SlashCommandRegistryContext =
	createContext<SlashCommandRegistry | null>(null);
