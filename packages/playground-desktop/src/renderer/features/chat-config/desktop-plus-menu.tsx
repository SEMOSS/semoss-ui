import {
	AttachFilesItem,
	ChooseAgentItem,
	KnowledgeItem,
	ModeChoiceItem,
	ToolsItem,
} from "@semoss/chat";
import { AttachFolderMenuItem } from "../local-folders/attach-folder-menu-item";

/** The desktop's plus menu: the chat's items, with Attach Folder under Attach Files. */
export const DesktopPlusMenu = () => (
	<>
		<AttachFilesItem />
		<AttachFolderMenuItem />
		<KnowledgeItem />
		<ToolsItem />
		<ModeChoiceItem />
		<ChooseAgentItem />
	</>
);
