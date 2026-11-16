import {
	FileDropProvider,
	RoomConversation,
	RoomFrame,
	RoomHeader,
	RoomWorkbench,
} from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";

/**
 * The playground's room: the header with the navigation button, the
 * conversation, and the Workspace, composed from the open room's pieces.
 */
export const RoomPageBody = () => (
	<RoomFrame
		header={<RoomHeader leading={<PageHeaderNavigation />} />}
		workbench={<RoomWorkbench />}
	>
		<FileDropProvider>
			<RoomConversation />
		</FileDropProvider>
	</RoomFrame>
);
