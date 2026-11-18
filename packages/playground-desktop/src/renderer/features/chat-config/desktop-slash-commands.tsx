import { DefaultSlashCommands } from "@semoss/chat";
import { AttachFolderCommand } from "../local-folders/attach-folder-command";

/** The desktop's "/" menu: the chat's commands, with Attach Folder in its Chat group. */
export const DesktopSlashCommands = () => (
	<>
		<DefaultSlashCommands />
		<AttachFolderCommand />
	</>
);
