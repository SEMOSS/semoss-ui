import { type ReactNode, useState } from "react";
import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import { StoreState } from "@semoss/utility/store";
import {
	type RegisteredSlashCommand,
	SlashCommandProvider,
	SlashCommandRegistryContext,
} from "./slash-command.context";
import type { SlashCommandEntry } from "./slash-command-entry";

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
 * below. The commands draw nothing; they are mounted out of sight beside the
 * composer, inside its contexts.
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
	const entries = useStoreSelector(registry, inPageOrder);

	return (
		<SlashCommandRegistryContext.Provider value={registry}>
			<div hidden>{commands}</div>
			<SlashCommandProvider commands={entries}>
				{children}
			</SlashCommandProvider>
		</SlashCommandRegistryContext.Provider>
	);
};
