import { observer } from "mobx-react-lite";
import { RoomContent } from "@/components/room/room-content";
import { RoomWorkbench } from "@/components/room/room-workbench";
import { FileDragProvider } from "@/contexts/file-drag-context";
import { useRoom } from "@/contexts/room.context";
import { RoomLayout } from "@/features/conversation/room-layout";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { RoomHeader } from "@/features/room-header/room-header";

/**
 * The playground's room: the header with the navigation button, the
 * conversation, and the Workspace, composed from the open room's pieces.
 */
export const RoomPageBody = observer(() => {
	const room = useRoom();

	return (
		<RoomLayout
			isWorkbenchOpen={room.sidebar.isOpen}
			onWorkbenchCollapse={() => void room.closeSidebar()}
			header={
				<RoomHeader room={room} leading={<PageHeaderNavigation />} />
			}
			workbench={<RoomWorkbench room={room} />}
		>
			<FileDragProvider>
				<RoomContent room={room} />
			</FileDragProvider>
		</RoomLayout>
	);
});
