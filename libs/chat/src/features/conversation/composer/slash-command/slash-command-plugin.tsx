import type React from "react";
import { MentionMenuPortal } from "../editor/mention-menu-portal";
import { MentionPlugin } from "../editor/mention-plugin";
import type { SlashCommandEntry } from "./slash-command-entry";
import { filterSlashCommands, SlashCommandMenu } from "./slash-command-menu";
import { useSlashCommands } from "./slash-command-registry.context";

/** Props for {@link SlashCommandPlugin}. */
interface SlashCommandPluginProps {
	/** The model is responding, which locks commands locked while busy. */
	isLoading?: boolean;
	/** The latest response has tool calls, which locks them too. */
	hasTools?: boolean;
}

/**
 * Wires `MentionPlugin` to the slash command system. Must be rendered inside a
 * `LexicalComposer` wrapped by `SlashCommandRegistryProvider` so it can read the
 * current command list from context via `useSlashCommands()`. A host with no
 * "/" menu (`ChatConfig.components.SlashCommands: null`) does not mount it.
 */
export const SlashCommandPlugin: React.FC<SlashCommandPluginProps> = ({
	isLoading,
	hasTools,
}) => {
	const { commands } = useSlashCommands();
	const isBusy = Boolean(isLoading || hasTools);

	/**
	 * Runs a picked command, unless it is locked while busy.
	 *
	 * @param cmd - The command.
	 * @returns Whether it ran.
	 */
	const runCommand = (cmd: SlashCommandEntry): boolean => {
		if (cmd.isLockedWhileBusy && isBusy) return false;
		cmd.onExecute();
		return true;
	};

	/**
	 * The command the menu has highlighted, or its first match.
	 *
	 * @param query - What was typed after "/".
	 * @param selectedIndex - The highlighted row.
	 * @returns The command, or undefined when none matches.
	 */
	const findCommand = (
		query: string,
		selectedIndex: number,
	): SlashCommandEntry | undefined => {
		const filtered = filterSlashCommands(commands, query);
		return filtered[selectedIndex] ?? filtered[0];
	};

	return (
		<MentionPlugin
			trigger="/"
			onAccept={(query, selectedIndex) => {
				const match = findCommand(query, selectedIndex);
				if (match) runCommand(match);
			}}
			onTabComplete={(query, selectedIndex) =>
				findCommand(query, selectedIndex)?.id
			}
			renderMenu={({
				isOpen,
				onOpenChange,
				menuPosition,
				onRequestClose,
				query,
				selectedIndex,
				onItemCountChange,
				onSelectedIndexChange,
			}) =>
				isOpen && menuPosition ? (
					<MentionMenuPortal
						menuPosition={menuPosition}
						onClose={() => onOpenChange(false)}
					>
						<SlashCommandMenu
							query={query}
							selectedIndex={selectedIndex}
							onItemCountChange={onItemCountChange}
							onSelectedIndexChange={onSelectedIndexChange}
							isBusy={isBusy}
							onCommandSelect={(cmd) => {
								if (runCommand(cmd)) onRequestClose();
							}}
						/>
					</MentionMenuPortal>
				) : null
			}
		/>
	);
};
