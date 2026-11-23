import {
	AgentItem,
	AttachFilesItem,
	KnowledgeItem,
	ModeItem,
	ToolsItem,
} from "@semoss/chat";
import { AttachFolderItem } from "../local-folders/attach-folder-item";

/** The desktop's plus menu: the chat's items, with Attach Folder under Attach Files. */
export const DesktopPlusMenu = () => (
	<>
		<AttachFilesItem />
		<AttachFolderItem />
		<KnowledgeItem />
		<ToolsItem />
		<ModeItem />
		<AgentItem />
	</>
);
