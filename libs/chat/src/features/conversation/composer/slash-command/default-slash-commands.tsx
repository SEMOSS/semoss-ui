import { ComposerCommands } from "./composer-commands";
import { PromptCommands } from "./prompt-commands";
import { RoomCommands } from "./room-commands";
import { WorkspaceCommands } from "./workspace-commands";

/**
 * The composer's "/" menu as the chat has it, and the place to start a
 * host's own (`ChatConfig.components.SlashCommands`): the Chat group, the
 * Workspace's panels, the room's actions, and its prompts. A host adds a
 * command with `SlashCommand`.
 */
export const DefaultSlashCommands = () => (
	<>
		<ComposerCommands />
		<WorkspaceCommands />
		<RoomCommands />
		<PromptCommands />
	</>
);
