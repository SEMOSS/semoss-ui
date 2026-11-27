import { useRef } from "react";
import { useTranslation } from "@semoss/i18n";
import type { RoomStore } from "../room/store/room.store";
import { ROOM_PANEL_TYPES } from "../room/store/room-workbench-layout";
import {
	DRAFT_READY_PANEL_KINDS,
	type DraftPanelRequest,
	type DraftWorkbenchPanels,
} from "../workbench/rail/use-workbench-panels";
import type { RoomPreparation } from "./use-prepared-room";

/** What {@link useDraftPanels} returns. */
interface NewRoomPanels {
	/** The room whose Workspace shows: the prepared room once there is one. */
	readonly workbenchRoom: RoomStore;
	/** The draft's own way to open panels, for the rail, the header, and the slash menu. */
	readonly draftPanels: DraftWorkbenchPanels;
	/** Prepares the room again, for the panel that asked last. */
	readonly retryPreparation: () => void;
}

/**
 * Show the Workspace, or one of its panels, in a room.
 *
 * @param room - The draft or the prepared room.
 * @param request - What to show.
 * @param activityTitle - The activity log's tab title.
 */
const showPanel = (
	room: RoomStore,
	request: DraftPanelRequest,
	activityTitle: string,
): void => {
	switch (request.kind) {
		case "workbench":
			room.openWorkbench();
			return;
		case "settings":
			room.chatTools.openRoomSettings();
			return;
		case "files":
			room.openWorkbenchFileExplorer();
			return;
		case "activity":
			room.openWorkbenchPanel(
				ROOM_PANEL_TYPES.ACTIVITY_LOG,
				{},
				activityTitle,
			);
			return;
		case "connector":
			room.connectors.openSourcePanel(request.service);
	}
};

/**
 * A new chat's Workspace panels. Every request shares preparation, layout
 * transfer, and abandoned-draft cleanup. The Workspace and Settings show on
 * the draft at once and carry over to the room, unless closed meanwhile;
 * Files, the activity log, and the viewers read the room's insight, so they
 * wait for it. A failure shows in the Workspace, where Retry opens the same
 * panel.
 *
 * @param newRoom - The draft.
 * @param preparation - The draft's lazily prepared room.
 * @param isLoading - Whether the first message is creating its room.
 * @returns The room the Workspace shows, the draft's panel actions, and Retry.
 */
export const useDraftPanels = (
	newRoom: RoomStore,
	preparation: RoomPreparation,
	isLoading: boolean,
): NewRoomPanels => {
	const { t } = useTranslation("room");
	const { room: preparedRoom, isPreparing, prepare } = preparation;
	// what Retry opens again after a failed preparation; read only by Retry
	const pendingPanelRef = useRef<DraftPanelRequest>({ kind: "workbench" });
	const activityTitle = t("room:workspacePlaces.activity");

	const openPanel = async (request: DraftPanelRequest): Promise<void> => {
		// submitting builds its own room
		if (isLoading) return;
		if (preparedRoom) {
			showPanel(preparedRoom, request, activityTitle);
			return;
		}
		pendingPanelRef.current = request;
		const isReady = DRAFT_READY_PANEL_KINDS.has(request.kind);
		if (isReady) showPanel(newRoom, request, activityTitle);
		const room = await prepare();
		if (!room) {
			if (!isReady) newRoom.openWorkbench();
			return;
		}
		if (!isReady) showPanel(room, request, activityTitle);
		else if (newRoom.workbenchPane.isOpen) room.openWorkbench();
	};

	return {
		workbenchRoom: preparedRoom ?? newRoom,
		draftPanels: {
			onOpenPanel: (request) => void openPanel(request),
			isBusy: isPreparing || isLoading,
			connectors: newRoom.connectors,
			prepareRoom: async () => {
				if (isLoading) return null;
				return preparedRoom ?? prepare();
			},
		},
		retryPreparation: () => void openPanel(pendingPanelRef.current),
	};
};
