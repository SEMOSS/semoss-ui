import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Separator } from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";
import {
	type DraftWorkspacePlaces,
	useWorkspacePlaces,
} from "./use-workspace-places";
import { WorkspaceRailItem } from "./workspace-rail-item";

export interface WorkspaceRailProps {
	/** The room whose Workspace the rail opens. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
}

/**
 * The Workspace's places, on screen whether or not the Workspace is open: the
 * room's own places, then the connector viewers the chat can show.
 */
export const WorkspaceRail = observer(({ room, draft }: WorkspaceRailProps) => {
	const { t } = useTranslation("room");
	const places = useWorkspacePlaces(room, draft);
	const roomPlaces = places.filter((place) => place.kind === "room");
	const connectorPlaces = places.filter(
		(place) => place.kind === "connector",
	);
	return (
		<nav
			aria-label={t("studio.workArea")}
			className="flex h-full w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-s bg-sidebar p-2"
		>
			{roomPlaces.map((place) => (
				<WorkspaceRailItem key={place.id} room={room} place={place} />
			))}
			{connectorPlaces.length > 0 && <Separator className="my-1" />}
			{connectorPlaces.map((place) => (
				<WorkspaceRailItem key={place.id} room={room} place={place} />
			))}
		</nav>
	);
});
