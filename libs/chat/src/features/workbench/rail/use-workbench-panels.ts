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
import { useChatCustomization } from "../../chat/config/use-chat-customization";
import type { ConnectorsStore } from "../../connectors/store/connectors.store";
import { useConnectors } from "../../connectors/store/use-connectors";
import { RoomLayoutActionsContext } from "../../room/layout/room-layout-actions.context";
import type { RoomStore } from "../../room/store/room.store";
import { ROOM_PANEL_TYPES } from "../../room/store/room-workbench-layout";
import { useRoomSelector } from "../../room/store/use-room-selector";

/** What every Workspace panel option has, whatever its kind. */
interface WorkbenchPanelOptionBase {
	/** Stable key; also the panel's slash command id. */
	id: string;
	/** Visible name, short; the same on the rail, its tab, and the slash menu. */
	label: string;
	/** Which blueprint it opens, for a caller that docks it itself. */
	panelType: WorkbenchPanelType;
	/** The parameters it is opened with, and what it dedupes on. */
	panelConfig: WorkbenchPanelParams;
	/** What the panel holds, shown on hover. */
	description?: string;
	/** Whether the panel cannot open yet. */
	isDisabled: boolean;
	/** Whether the panel waits on a new chat preparing its room. */
	isLoading: boolean;
	/** Opens the Workspace on the panel. */
	onOpen: () => void;
}

/** A panel the Workspace opens: one of the room's own, or a connector viewer. */
export type WorkbenchPanelOption =
	| (WorkbenchPanelOptionBase & { kind: "room"; icon: LucideIcon })
	| (WorkbenchPanelOptionBase & { kind: "connector"; brand: ConnectorBrand });

/** What a new chat opens in its Workspace before its first message. */
export type NewRoomPanelRequest =
	| { kind: "workbench" }
	| { kind: "settings" }
	| { kind: "files" }
	| { kind: "activity" }
	| { kind: "connector"; service: ConnectorViewerService };

/**
 * Requests a draft shows at once, since they need no insight; every other
 * panel waits for the draft to prepare its room.
 */
export const NEW_ROOM_READY_PANEL_KINDS: ReadonlySet<
	NewRoomPanelRequest["kind"]
> = new Set(["workbench", "settings"]);

/** How a new chat opens its Workspace's panels before its first message. */
export interface NewRoomWorkbenchPanels {
	/** Opens the Workspace or one of its panels, preparing the draft's room. */
	onOpenPanel: (request: NewRoomPanelRequest) => void;
	/** Whether the draft is preparing its room or sending its first message. */
	isBusy: boolean;
	/** The draft's connectors, whose viewers are offered. */
	connectors: ConnectorsStore;
	/**
	 * Attach folders from the user's machine: prepares the draft's room, which
	 * keeps them, then opens its Files. Only where the host can reach the
	 * user's files.
	 */
	onAttachFolder?: () => void;
}

/**
 * The panels a room's Workspace opens: Files, Settings, and the activity log,
 * then the connector viewers the chat can show. A draft's panels that need its
 * room wait while it prepares. Opening a panel also brings the Workspace into
 * view, selecting its tab on narrow screens.
 *
 * @param room - The room whose Workspace shows the panels.
 * @param newRoomPanels - A new chat's own panel actions, until its first message.
 * @returns The room's panels, then the connector viewers, as the host's
 * `ChatConfig.customize.workbenchPanels` leaves them.
 */
export const useWorkbenchPanels = (
	room: RoomStore,
	newRoomPanels?: NewRoomWorkbenchPanels,
): WorkbenchPanelOption[] => {
	const { t } = useTranslation(["room", "connectors"]);
	const roomLayout = useContext(RoomLayoutActionsContext);
	const customize = useChatCustomization().workbenchPanels;
	const connectors = newRoomPanels?.connectors ?? room.connectors;
	// the viewers on offer follow the connectors switched on and signed in
	useConnectors(connectors);
	const fileMode = useRoomSelector(room, (current) => current.fileMode);
	const isBusy = newRoomPanels?.isBusy ?? false;
	// a busy draft holds back every panel that needs its room
	const isWaiting = (kind: NewRoomPanelRequest["kind"]) =>
		isBusy && !NEW_ROOM_READY_PANEL_KINDS.has(kind);
	// a new chat routes the request through its draft; a room opens it itself
	const openPanel =
		(request: NewRoomPanelRequest, openInRoom: () => void) => () => {
			if (newRoomPanels) newRoomPanels.onOpenPanel(request);
			else openInRoom();
			roomLayout?.revealWorkbench();
		};

	const panels: WorkbenchPanelOption[] = [
		{
			kind: "room",
			id: "files",
			label: t("workspacePlaces.files"),
			description: t("workspacePlaces.descriptions.files"),
			icon: FolderTreeIcon,
			panelType: FILE_PANEL_TYPES.FILE_EXPLORER,
			panelConfig: { mode: fileMode },
			isDisabled: isWaiting("files"),
			isLoading: isWaiting("files"),
			onOpen: openPanel({ kind: "files" }, () =>
				room.openWorkbenchFileExplorer(),
			),
		},
		{
			kind: "room",
			id: "settings",
			label: t("workspacePlaces.settings"),
			description: t("workspacePlaces.descriptions.settings"),
			icon: Settings2Icon,
			panelType: ROOM_PANEL_TYPES.CONFIGURATION,
			panelConfig: {},
			isDisabled: isWaiting("settings"),
			isLoading: false,
			onOpen: openPanel(
				{ kind: "settings" },
				room.chatTools.openRoomSettings,
			),
		},
	];
	if (room.theme.featureFlags?.showActivityLog !== false) {
		panels.push({
			kind: "room",
			id: "activity",
			label: t("workspacePlaces.activity"),
			description: t("workspacePlaces.descriptions.activity"),
			icon: ScrollTextIcon,
			panelType: ROOM_PANEL_TYPES.AUDIT_LOG,
			panelConfig: {},
			isDisabled: isWaiting("activity"),
			isLoading: false,
			onOpen: openPanel({ kind: "activity" }, () =>
				room.openWorkbenchPanel(
					ROOM_PANEL_TYPES.AUDIT_LOG,
					{},
					t("workspacePlaces.activity"),
				),
			),
		});
	}
	for (const source of connectors.availableSources) {
		panels.push({
			kind: "connector",
			id: source.service,
			label: t(source.nameKey),
			brand: source.brand,
			panelType: source.panelType,
			panelConfig: {},
			// a draft prepares its room first, so one preparation at a time
			isDisabled: isWaiting("connector"),
			isLoading: false,
			onOpen: openPanel(
				{ kind: "connector", service: source.service },
				() => connectors.openSourcePanel(source.service),
			),
		});
	}
	return customize ? customize(panels, room) : panels;
};
