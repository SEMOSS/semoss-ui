import { observer } from "mobx-react-lite";
import { Chat, useRoom } from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";

/**
 * The playground's room: the header with the navigation button, the
 * conversation, and the Workspace, composed from the open room's pieces.
 */
export const RoomPageBody = observer(() => {
	const room = useRoom();

	return (
		<Chat.Layout
			isWorkbenchOpen={room.sidebar.isOpen}
			onWorkbenchCollapse={() => void room.closeSidebar()}
			header={
				<Chat.Header room={room} leading={<PageHeaderNavigation />} />
			}
			workbench={<Chat.Workbench room={room} />}
		>
			<Chat.FileDrop>
				<Chat.Conversation room={room} />
			</Chat.FileDrop>
		</Chat.Layout>
	);
});
