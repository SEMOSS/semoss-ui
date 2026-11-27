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
import { SidebarTrigger } from "@semoss/ui/next";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/**
 * The room the route names, composed from the chat's pieces, with follow-up
 * suggestions where the server's theme turns them on.
 */
export const RoomPage = () => {
	const { roomId = "" } = useParams();
	const hasSuggestions =
		!!usePlaygroundTheme().featureFlags?.enableSuggestions;

	return (
		<RoomScope roomId={roomId}>
			<RoomFrame
				header={<RoomHeader leading={<SidebarTrigger />} />}
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
