import { useParams } from "react-router";
import {
	FileDropProvider,
	RoomConversation,
	RoomFrame,
	RoomHeader,
	RoomScope,
	RoomWorkbench,
} from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";

/**
 * The room the route names, composed from the chat's room pieces: the header
 * with the navigation button, the conversation (which takes dropped files),
 * and the Workspace.
 */
export const RoomPage = () => {
	const { roomId = "" } = useParams();

	return (
		<RoomScope roomId={roomId}>
			<RoomFrame
				header={<RoomHeader leading={<PageHeaderNavigation />} />}
				workbench={<RoomWorkbench />}
			>
				<FileDropProvider>
					<RoomConversation />
				</FileDropProvider>
			</RoomFrame>
		</RoomScope>
	);
};
