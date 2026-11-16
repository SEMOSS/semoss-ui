import { Chat } from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";

/**
 * The playground's room: the header with the navigation button, the
 * conversation, and the Workspace, composed from the open room's pieces.
 */
export const RoomPageBody = () => (
	<Chat.Frame
		header={<Chat.Header leading={<PageHeaderNavigation />} />}
		workbench={<Chat.Workbench />}
	>
		<Chat.FileDrop>
			<Chat.Conversation />
		</Chat.FileDrop>
	</Chat.Frame>
);
