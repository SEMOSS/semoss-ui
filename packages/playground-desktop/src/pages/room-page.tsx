import { useParams } from "react-router";
import { RoomView } from "@semoss/chat";

/**
 * The room the address names.
 *
 * @component
 */
export const RoomPage = () => {
	const { roomId = "" } = useParams();
	return <RoomView key={roomId} roomId={roomId} />;
};
