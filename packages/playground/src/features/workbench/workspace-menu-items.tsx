import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem, DropdownMenuSeparator } from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";
import {
	type DraftWorkspacePlaces,
	useWorkspacePlaces,
	type WorkspacePlace,
} from "./use-workspace-places";
import { WorkspacePlaceIcon } from "./workspace-place-icon";

export interface WorkspaceMenuItemsProps {
	/** The room whose Workspace the places open in. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
	/** Dismiss the containing mobile drawer after selecting a place. */
	onNavigate?: () => void;
}

/** The rail's places as menu items, for screens too narrow for the rail. */
export const WorkspaceMenuItems = observer(
	({ room, draft, onNavigate }: WorkspaceMenuItemsProps) => {
		const { t } = useTranslation("room");
		const places = useWorkspacePlaces(room, draft);
		const roomPlaces = places.filter((place) => place.kind === "room");
		const connectorPlaces = places.filter(
			(place) => place.kind === "connector",
		);
		const renderItem = (place: WorkspacePlace) => (
			<DropdownMenuItem
				key={place.id}
				className="text-xs max-md:min-h-11"
				disabled={place.isDisabled}
				onSelect={() => {
					place.onOpen();
					onNavigate?.();
				}}
			>
				<WorkspacePlaceIcon place={place} className="size-4 shrink-0" />
				{place.isLoading ? t("studio.preparingWorkspace") : place.label}
			</DropdownMenuItem>
		);
		return (
			<>
				{roomPlaces.map(renderItem)}
				{connectorPlaces.length > 0 && <DropdownMenuSeparator />}
				{connectorPlaces.map(renderItem)}
			</>
		);
	},
);
