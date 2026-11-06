import { useParams } from "react-router";
import { RoomView } from "@semoss/chat";
import { PageHeaderNavigation } from "@/features/navigation/page-header-navigation";

/**
 * The room the address names.
 *
 * @component
 */
export const RoomPage = () => {
	const { roomId = "" } = useParams();
	return (
		<RoomView roomId={roomId} headerLeading={<PageHeaderNavigation />} />
	);
};
