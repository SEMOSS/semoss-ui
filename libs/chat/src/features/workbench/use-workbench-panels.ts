import {
	FolderTreeIcon,
	type LucideIcon,
	ScrollTextIcon,
	Settings2Icon,
} from "lucide-react";
import { type ReactNode, useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { useRoomSelector } from "@semoss/sdk/react";
import { RoomLayoutActionsContext } from "../conversation/room-layout-actions.context";
import { ROOM_PANEL_TYPES } from "./room-sidebar";
import type { RoomUiStore } from "./room-ui.store";

interface WorkbenchPanelOptionBase {
	/** Stable key; also the panel's slash command id. */
	id: string;
	/** Visible name, short; the same in the header, tabs, and slash menu. */
	label: string;
	/** What the panel holds, shown on hover. */
	description?: string;
	/** Whether the panel cannot open yet. */
	isDisabled: boolean;
	/** Whether the panel waits on a new chat preparing its room. */
	isLoading: boolean;
	/** Opens the Workspace on the panel. */
	onOpen: () => void;
}

/**
 * A panel the Workspace opens: one of the room's own, or one an integration
 * offers, such as a connector viewer.
 */
export type WorkbenchPanelOption =
	| (WorkbenchPanelOptionBase & { kind: "room"; icon: LucideIcon })
	| (WorkbenchPanelOptionBase & { kind: "integration"; icon?: ReactNode });

/** What a new chat opens in its Workspace before its first message. */
export type NewRoomPanelRequest =
	| { kind: "workbench" }
	| { kind: "settings" }
	| { kind: "files" }
	| { kind: "activity" }
	| { kind: "integration"; type: string; name: string };

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
	/** The draft, whose integrations offer their panels. */
	draft: RoomUiStore;
}

/**
 * The panels a room's Workspace opens: Files, Settings, and the activity log,
 * then the panels the room's integrations offer, such as the connector
 * viewers the chat can show. A draft's panels that need its room wait while
 * it prepares. Opening a panel also brings the Workspace into view, selecting
 * its tab on narrow screens.
 *
 * @param room - The room whose Workspace shows the panels.
 * @param newRoomPanels - A new chat's own panel actions, until its first message.
 * @return The room's panels, then its integrations'.
 */
export const useWorkbenchPanels = (
	room: RoomUiStore,
	newRoomPanels?: NewRoomWorkbenchPanels,
): WorkbenchPanelOption[] => {
	const { t } = useTranslation("room");
	const roomLayout = useContext(RoomLayoutActionsContext);
	// a draft's integrations offer its panels until it has a room
	const railRoom = newRoomPanels?.draft ?? room;
	const railPanels = useRoomSelector(railRoom, (r) =>
		r.getIntegrationRailPanels(),
	);
	const isBusy = newRoomPanels?.isBusy ?? false;
	const isWaiting = (kind: NewRoomPanelRequest["kind"]) =>
		isBusy && !NEW_ROOM_READY_PANEL_KINDS.has(kind);
	const open =
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
			isDisabled: isWaiting("files"),
			isLoading: isWaiting("files"),
			onOpen: open({ kind: "files" }, () =>
				room.openSidebarFileExplorer(),
			),
		},
		{
			kind: "room",
			id: "settings",
			label: t("workspacePlaces.settings"),
			description: t("workspacePlaces.descriptions.settings"),
			icon: Settings2Icon,
			isDisabled: isWaiting("settings"),
			isLoading: false,
			onOpen: open({ kind: "settings" }, room.openRoomSettings),
		},
	];
	if (room.host.featureFlags?.showActivityLog !== false) {
		panels.push({
			kind: "room",
			id: "activity",
			label: t("workspacePlaces.activity"),
			description: t("workspacePlaces.descriptions.activity"),
			icon: ScrollTextIcon,
			isDisabled: isWaiting("activity"),
			isLoading: false,
			onOpen: open({ kind: "activity" }, () =>
				room.openSidebarPanel(
					ROOM_PANEL_TYPES.AUDIT_LOG,
					{},
					t("workspacePlaces.activity"),
				),
			),
		});
	}
	for (const panel of railPanels) {
		panels.push({
			kind: "integration",
			id: panel.type,
			label: panel.name,
			icon: panel.icon,
			// a draft prepares its room first, so one preparation at a time
			isDisabled: isWaiting("integration"),
			isLoading: false,
			onOpen: open(
				{ kind: "integration", type: panel.type, name: panel.name },
				() => room.openSidebarPanel(panel.type, {}, panel.name),
			),
		});
	}
	return panels;
};
