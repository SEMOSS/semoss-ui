import type React from "react";
import { useChatConfig } from "../../../chat-config/use-chat-config";
import { MentionPlugin } from "../mention-plugin";
import { useSlashCommands } from "./context";
import { filterSlashCommands, SlashCommandMenu } from "./menu";
import { SlashCommandMenuPortal } from "./menu-portal";
import type { SlashCommand } from "./types";

/** Whether the chat runs in a frame; a frame without access to its parent counts. */
let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

/** Props for {@link SlashCommandPlugin}. */
interface SlashCommandPluginProps {
	/** The model is responding, which locks commands locked while busy. */
	isLoading?: boolean;
	/** The latest response has tool calls, which locks them too. */
	hasTools?: boolean;
}

/**
 * Wires `MentionPlugin` to the slash command system. Must be rendered inside a
 * `LexicalComposer` wrapped by `SlashCommandProvider` so it can read the
 * current command list from context via `useSlashCommands()`. Renders nothing
 * in a frame when the theme hides tools there.
 */
export const SlashCommandPlugin: React.FC<SlashCommandPluginProps> = ({
	isLoading,
	hasTools,
}) => {
	const { theme } = useChatConfig();
	const { commands } = useSlashCommands();
	const isBusy = Boolean(isLoading || hasTools);

	if (theme.featureFlags?.hideToolsInIframe && isIframed) return null;

	/**
	 * Runs a picked command, unless it is locked while busy.
	 *
	 * @param cmd - The command.
	 * @returns Whether it ran.
	 */
	const runCommand = (cmd: SlashCommand): boolean => {
		if (cmd.isLockedWhileBusy && isBusy) return false;
		cmd.onExecute();
		return true;
	};

	return (
		<MentionPlugin
			trigger="/"
			onAccept={(query, selectedIndex) => {
				const filtered = filterSlashCommands(commands, query);
				const match = filtered[selectedIndex] ?? filtered[0];
				if (match) runCommand(match);
			}}
			onTabComplete={(query, selectedIndex) => {
				const filtered = filterSlashCommands(commands, query);
				const match = filtered[selectedIndex] ?? filtered[0];
				return match?.id;
			}}
			MenuComponent={({
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
					<SlashCommandMenuPortal
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
					</SlashCommandMenuPortal>
				) : null
			}
		/>
	);
};
