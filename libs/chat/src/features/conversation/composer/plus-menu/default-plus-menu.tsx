import { AgentItem } from "./agent-item";
import { AttachFilesItem } from "./attach-files-item";
import { KnowledgeItem } from "./knowledge-item";
import { ModeItem } from "./mode-item";
import { ToolsItem } from "./tools-item";

/**
 * The composer's plus menu as the chat has it, and the place to start a
 * host's own (`ChatConfig.components.PlusMenu`): Attach, Knowledge, Toolbox,
 * then, in a new chat, the Chat and Agent choice and the agent picker. Each
 * item hides itself where it cannot run.
 */
export const DefaultPlusMenu = () => (
	<>
		<AttachFilesItem />
		<KnowledgeItem />
		<ToolsItem />
		<ModeItem />
		<AgentItem />
	</>
);
