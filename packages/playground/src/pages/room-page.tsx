import { useParams } from "react-router";
import { RoomScope } from "@/features/room/room-scope";
import { RoomPageBody } from "@/features/room-page/room-page-body";

/** The room page: the room the route names, composed by the playground. */
export const RoomPage = () => {
	const { roomId = "" } = useParams();

	return (
		<RoomScope roomId={roomId}>
			<RoomPageBody />
		</RoomScope>
	);
};
