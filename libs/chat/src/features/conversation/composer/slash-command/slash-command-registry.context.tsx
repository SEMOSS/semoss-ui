import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import { StoreState } from "@semoss/utility/store";
import type { SlashCommandEntry } from "./slash-command-entry";

/** What {@link useSlashCommands} reads. */
interface SlashCommands {
	/** Every command offered, in the order the composer lists them. */
	readonly commands: SlashCommandEntry[];
}

/** The composer's slash commands, for its "/" menu; empty outside the composer. */
export const SlashCommandsContext = createContext<SlashCommands>({
	commands: [],
});

/**
 * Read the composer's slash commands.
 *
 * @returns The commands the slash menu lists.
 */
export const useSlashCommands = (): SlashCommands =>
	useContext(SlashCommandsContext);

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

/**
 * The registered commands in the order they are placed in the page.
 *
 * @param registered - The commands, by key.
 * @returns Their entries, in page order.
 */
const inPageOrder = (
	registered: ReadonlyMap<string, RegisteredSlashCommand>,
): SlashCommandEntry[] =>
	[...registered.values()]
		.sort((first, second) =>
			first.marker.compareDocumentPosition(second.marker) &
			Node.DOCUMENT_POSITION_FOLLOWING
				? -1
				: 1,
		)
		.map(({ entry }) => entry);

/** Props for {@link SlashCommandRegistryProvider}. */
interface SlashCommandRegistryProviderProps {
	/** The composer's commands: `SlashCommand`s, as the host's slot places them. */
	commands: ReactNode;
	/** The composer, whose slash menu lists them. */
	children: ReactNode;
}

/**
 * Collect the commands `commands` registers and give them to the slash menu
 * below (`useSlashCommands`). The commands draw nothing; they are mounted out
 * of sight beside the composer, inside its contexts.
 */
export const SlashCommandRegistryProvider = ({
	commands,
	children,
}: SlashCommandRegistryProviderProps) => {
	const [registry] = useState(
		() =>
			new StoreState<ReadonlyMap<string, RegisteredSlashCommand>>(
				new Map(),
			),
	);
	// the selector hands back the same list while the commands are the same
	const entries = useStoreSelector(registry, inPageOrder);
	const slashCommands = useMemo(() => ({ commands: entries }), [entries]);

	return (
		<SlashCommandRegistryContext.Provider value={registry}>
			<div hidden>{commands}</div>
			<SlashCommandsContext.Provider value={slashCommands}>
				{children}
			</SlashCommandsContext.Provider>
		</SlashCommandRegistryContext.Provider>
	);
};
