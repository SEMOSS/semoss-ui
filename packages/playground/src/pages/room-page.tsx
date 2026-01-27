import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { Room } from "@/components";
import { useGlobalBreadcrumbs } from "@/hooks";

/**
 * The page for a room
 *
 * @component
 */
export const RoomPage = observer(() => {
	// set the get the room based on the params
	const { roomId } = useParams();

	/**
	 * Effects
	 */
	// set the breadcrumbs
	useGlobalBreadcrumbs([
		{
			name: "Home",
			path: "/",
		},
		{
			name: "Room",
			path: `/room/${roomId}`,
		},
	]);

	return (
		<InsightProvider key={roomId}>
			<Room roomId={roomId} />
		</InsightProvider>
	);
});
