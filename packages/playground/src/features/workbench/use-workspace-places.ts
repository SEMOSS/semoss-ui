import {
	FolderTreeIcon,
	type LucideIcon,
	ScrollTextIcon,
	Settings2Icon,
} from "lucide-react";
import { useContext } from "react";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ConnectorBrand } from "@semoss/shared";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import type { ConnectorsStore } from "@/features/connectors/connectors.store";
import { ConversationWorkspaceActionsContext } from "@/features/conversation/conversation-workspace-actions.context";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";

interface WorkspacePlaceBase {
	/** Stable key. */
	id: string;
	/** Visible name, short; the same in the header, tabs, and slash menu. */
	label: string;
	/** What the place holds, shown on hover. */
	description?: string;
	/** The panel the place shows, for telling whether it is in front. */
	panelType: WorkbenchPanelType;
	/** That panel's identity, matched as `selectPanel` matches it. */
	panelConfig?: WorkbenchPanelParams;
	/** Whether the place cannot open yet. */
	isDisabled: boolean;
	/** Whether the place waits on a new chat preparing its room. */
	isLoading: boolean;
	/**
	 * Opens the Workspace on the place.
	 *
	 * @param trigger - The control that opened it, which gets focus back when
	 * the Workspace closes.
	 */
	onOpen: (trigger?: HTMLElement | null) => void;
}

/** A place the Workspace shows: one of the room's own, or a connector viewer. */
export type WorkspacePlace =
	| (WorkspacePlaceBase & { kind: "room"; icon: LucideIcon })
	| (WorkspacePlaceBase & { kind: "connector"; brand: ConnectorBrand });

/** How a new chat opens the Workspace's places before its first message. */
export interface DraftWorkspacePlaces {
	/** Opens the Workspace, then prepares the draft's room and opens it there. */
	onOpenWorkspace: () => void;
	/** Prepares the draft's room, then opens Chat Files in it. */
	onOpenFiles: () => void;
	/** Opens the draft's settings, then prepares its room and opens them there. */
	onOpenSettings: () => void;
	/** Prepares the draft's room, then opens the activity log in it. */
	onOpenActivity: () => void;
	/** Prepares the draft's room, then opens a connector viewer in it. */
	onOpenSource: (service: ConnectorViewerService) => void;
	/** Whether the draft is preparing its room. */
	isPreparing: boolean;
	/** The draft's connectors, whose viewers are offered. */
	connectors: ConnectorsStore;
}

/**
 * The places a room's Workspace opens: Files, Settings, and the activity log,
 * then the connector viewers the chat can show. A draft's Files, activity log,
 * and viewers wait while it prepares its room. Opening a place also brings the
 * work area into view, selecting its tab on narrow screens. Call it from an
 * observer: the viewers are read from MobX. It does not read the session's
 * logins itself; the composer's sign in notice keeps them current.
 *
 * @param room - The room whose Workspace shows the places.
 * @param draft - A new chat's own actions, until its first message.
 * @return The room's places, then the connector viewers.
 */
export const useWorkspacePlaces = (
	room: RoomStore,
	draft?: DraftWorkspacePlaces,
): WorkspacePlace[] => {
	const { t } = useTranslation(["room", "connectors"]);
	const workspace = useContext(ConversationWorkspaceActionsContext);
	const reveal =
		(open: () => void): WorkspacePlace["onOpen"] =>
		(trigger) => {
			open();
			workspace?.revealWorkArea(trigger);
		};
	const connectors = draft?.connectors ?? room.connectors;
	const isPreparing = draft?.isPreparing ?? false;
	const onOpenActivity =
		draft?.onOpenActivity ??
		(() =>
			room.openSidebarPanel(
				ROOM_PANEL_TYPES.AUDIT_LOG,
				{},
				t("workspacePlaces.activity"),
			));
	const showActivityLog = room.theme.featureFlags?.showActivityLog !== false;

	const places: WorkspacePlace[] = [
		{
			kind: "room",
			id: "files",
			label: t("workspacePlaces.files"),
			description: t("workspacePlaces.descriptions.files"),
			icon: FolderTreeIcon,
			panelType: FILE_PANEL_TYPES.FILE_EXPLORER,
			panelConfig: { mode: room.fileMode },
			isDisabled: isPreparing,
			isLoading: isPreparing,
			onOpen: reveal(
				draft?.onOpenFiles ??
					(() =>
						room.openSidebarFileExplorer(
							undefined,
							t("workspacePlaces.files"),
						)),
			),
		},
		{
			kind: "room",
			id: "settings",
			label: t("workspacePlaces.settings"),
			description: t("workspacePlaces.descriptions.settings"),
			icon: Settings2Icon,
			panelType: ROOM_PANEL_TYPES.CONFIGURATION,
			isDisabled: false,
			isLoading: false,
			onOpen: reveal(
				draft?.onOpenSettings ?? room.chatTools.openRoomSettings,
			),
		},
	];
	if (showActivityLog) {
		places.push({
			kind: "room",
			id: "activity",
			label: t("workspacePlaces.activity"),
			description: t("workspacePlaces.descriptions.activity"),
			icon: ScrollTextIcon,
			panelType: ROOM_PANEL_TYPES.AUDIT_LOG,
			isDisabled: isPreparing,
			isLoading: false,
			onOpen: reveal(onOpenActivity),
		});
	}
	for (const source of connectors.availableSources) {
		places.push({
			kind: "connector",
			id: source.service,
			label: t(source.nameKey),
			brand: source.brand,
			panelType: source.panelType,
			// a draft prepares its room first, so one preparation at a time
			isDisabled: isPreparing,
			isLoading: false,
			onOpen: reveal(() =>
				draft
					? draft.onOpenSource(source.service)
					: connectors.openSourcePanel(source.service),
			),
		});
	}
	return places;
};
