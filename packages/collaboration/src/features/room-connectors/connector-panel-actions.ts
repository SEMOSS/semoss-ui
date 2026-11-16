import {
	type AppIcon,
	OneDriveIcon,
	OutlookCalendarIcon,
	OutlookIcon,
	TeamsChannelsIcon,
	TeamsChatsIcon,
	TeamsFilesIcon,
} from "@/components/common/app-icons";
import type { ComposerPanelAction } from "@/features/rooms/components/room-composer.types";
import type {
	ConnectorBrowser,
	RoomConnectorsContextValue,
} from "./room-connectors.types";

// each app's own logo, so its entries read at a glance
const BROWSER_ACTIONS: readonly [ConnectorBrowser, string, AppIcon][] = [
	["mail", "Open Emails", OutlookIcon],
	["calendar", "Open Calendar", OutlookCalendarIcon],
	["onedrive", "Open OneDrive", OneDriveIcon],
	["teams-chats", "Open Teams Chats", TeamsChatsIcon],
	["teams-channels", "Open Teams Channels", TeamsChannelsIcon],
	["teams-files", "Open Teams Files", TeamsFilesIcon],
];

/**
 * The composer's + menu entries for the Microsoft 365 browsers. Each opens in
 * the dock's left rail, where Add to chat queues an item for the next message.
 *
 * @param returnToBrowser - The chat's connector navigation.
 * @param returnFocusId - The + button, which gets focus back when the rail closes.
 * @returns One entry per browser.
 */
export function connectorPanelActions(
	returnToBrowser: RoomConnectorsContextValue["returnToBrowser"],
	returnFocusId: string,
): ComposerPanelAction[] {
	return BROWSER_ACTIONS.map(([browser, label, icon]) => ({
		id: browser,
		label,
		icon,
		onSelect: () =>
			returnToBrowser(browser, "microsoft", undefined, returnFocusId),
	}));
}
