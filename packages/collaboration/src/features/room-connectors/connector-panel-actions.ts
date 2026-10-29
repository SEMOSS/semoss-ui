import {
	CalendarDays,
	Cloud,
	Files,
	Hash,
	type LucideIcon,
	Mail,
	MessagesSquare,
} from "lucide-react";
import type { ComposerPanelAction } from "@/features/rooms/components/room-composer.types";
import type {
	ConnectorBrowser,
	RoomConnectorsContextValue,
} from "./room-connectors.types";

const BROWSER_ACTIONS: readonly [ConnectorBrowser, string, LucideIcon][] = [
	["mail", "Open Emails", Mail],
	["calendar", "Open Calendar", CalendarDays],
	["onedrive", "Open OneDrive", Cloud],
	["teams-chats", "Open Teams Chats", MessagesSquare],
	["teams-channels", "Open Teams Channels", Hash],
	["teams-files", "Open Teams Files", Files],
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
