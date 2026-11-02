import {
	FolderTreeIcon,
	type LucideIcon,
	ScrollTextIcon,
	Settings2Icon,
	WrenchIcon,
} from "lucide-react";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ConnectorBrand } from "@semoss/shared";
import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import type { ConnectorsStore } from "@/features/connectors/connectors.store";
import type { RoomStore } from "@/stores/room/room.store";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";

interface WorkspacePlaceBase {
	/** Stable key. */
	id: string;
	/** Visible name. */
	label: string;
	/** The panel the place shows, for telling whether it is in front. */
	panelType: WorkbenchPanelType;
	/** That panel's identity, matched as `selectPanel` matches it. */
	panelConfig?: WorkbenchPanelParams;
	/** Whether the place cannot open yet. */
	isDisabled: boolean;
	/** Whether the place waits on a new chat preparing its room. */
	isLoading: boolean;
	/** Opens the Workspace on the place. */
	onOpen: () => void;
}

/** A place the Workspace shows: one of the room's own, or a connector viewer. */
export type WorkspacePlace =
	| (WorkspacePlaceBase & { kind: "room"; icon: LucideIcon })
	| (WorkspacePlaceBase & { kind: "connector"; brand: ConnectorBrand });

/** How a new chat opens the Workspace's places before its first message. */
export interface DraftWorkspacePlaces {
	/** Prepares the draft's room, then opens Chat Files in it. */
	onOpenFiles: () => void;
	/** Opens the draft's settings. */
	onOpenSettings: () => void;
	/** Opens the activity log; absent until the draft has prepared a room. */
	onOpenActivity?: () => void;
	/** Prepares the draft's room, then opens a connector viewer in it. */
	onOpenSource: (service: ConnectorViewerService) => void;
	/** Whether the draft is preparing its room. */
	isPreparing: boolean;
	/** The draft's connectors, whose viewers are offered. */
	connectors: ConnectorsStore;
}

/**
 * The places a room's Workspace opens: Chat Files, Chat Tools, the activity
 * log, and settings, then the connector viewers the chat can show. A draft has
 * no Chat Tools, since its tools are not settled until its first message, and
 * no activity log until it has a room. Call it from an observer: the viewers
 * are read from MobX. It does not read the session's logins itself; the
 * composer's sign in notice keeps them current.
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
	const connectors = draft?.connectors ?? room.connectors;
	const isPreparing = draft?.isPreparing ?? false;
	const onOpenActivity = draft
		? draft.onOpenActivity
		: () =>
				room.openSidebarPanel(
					ROOM_PANEL_TYPES.AUDIT_LOG,
					{},
					t("studio.activityLog"),
				);
	const showActivityLog = room.theme.featureFlags?.showActivityLog !== false;

	const places: WorkspacePlace[] = [
		{
			kind: "room",
			id: "files",
			label: t("workspacePlaces.files"),
			icon: FolderTreeIcon,
			panelType: FILE_PANEL_TYPES.FILE_EXPLORER,
			panelConfig: { mode: room.fileMode },
			isDisabled: isPreparing,
			isLoading: isPreparing,
			onOpen:
				draft?.onOpenFiles ??
				(() =>
					room.openSidebarFileExplorer(
						undefined,
						t("menuFileExplorer.name"),
					)),
		},
	];
	if (!draft) {
		places.push({
			kind: "room",
			id: "tools",
			label: t("workspacePlaces.tools"),
			icon: WrenchIcon,
			panelType: ROOM_PANEL_TYPES.CHAT_TOOLS,
			isDisabled: false,
			isLoading: false,
			onOpen: room.chatTools.openToolsPanel,
		});
	}
	if (showActivityLog && onOpenActivity) {
		places.push({
			kind: "room",
			id: "activity",
			label: t("workspacePlaces.activity"),
			icon: ScrollTextIcon,
			panelType: ROOM_PANEL_TYPES.AUDIT_LOG,
			isDisabled: false,
			isLoading: false,
			onOpen: onOpenActivity,
		});
	}
	places.push({
		kind: "room",
		id: "settings",
		label: t("workspacePlaces.settings"),
		icon: Settings2Icon,
		panelType: ROOM_PANEL_TYPES.CONFIGURATION,
		isDisabled: false,
		isLoading: false,
		onOpen:
			draft?.onOpenSettings ??
			(() =>
				room.openSidebarPanel(
					ROOM_PANEL_TYPES.CONFIGURATION,
					{},
					t("settings.panelTitle"),
				)),
	});
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
			onOpen: () =>
				draft
					? draft.onOpenSource(source.service)
					: connectors.openSourcePanel(source.service),
		});
	}
	return places;
};
