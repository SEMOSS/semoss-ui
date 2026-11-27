import { useParams } from "react-router";
import {
	FileDropProvider,
	RoomConversation,
	RoomFrame,
	RoomHeader,
	RoomScope,
	RoomSuggestions,
	RoomWorkbench,
} from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * The room the route names, composed from the chat's room pieces: the header
 * with the navigation button, the conversation (which takes dropped files,
 * and follow-up suggestions where the theme turns them on), and the Workspace.
 */
export const RoomPage = () => {
	const { roomId = "" } = useParams();
	const hasSuggestions =
		!!usePlaygroundTheme().featureFlags?.enableSuggestions;

	return (
		<RoomScope roomId={roomId}>
			<RoomFrame
				header={<RoomHeader leading={<PageHeaderNavigation />} />}
				workbench={<RoomWorkbench />}
			>
				<FileDropProvider>
					<RoomConversation
						suggestions={
							hasSuggestions ? <RoomSuggestions /> : null
						}
					/>
				</FileDropProvider>
			</RoomFrame>
		</RoomScope>
	);
};
