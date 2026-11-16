import { useParams } from "react-router";
import { Chat } from "@semoss/chat";
import { RoomPageBody } from "@/features/room-page/room-page-body";

/** The room page: the room the route names, composed by the playground. */
export const RoomPage = () => {
	const { roomId = "" } = useParams();

	return (
		<Chat.Room roomId={roomId}>
			<RoomPageBody />
		</Chat.Room>
	);
};
