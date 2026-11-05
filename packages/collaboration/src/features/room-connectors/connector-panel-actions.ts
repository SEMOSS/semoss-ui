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

// each app's own color, so its entries read at a glance
export const OUTLOOK_TONE = "text-blue-600 dark:text-blue-400";
export const TEAMS_TONE = "text-violet-600 dark:text-violet-400";
const ONEDRIVE_TONE = "text-sky-500 dark:text-sky-400";

const BROWSER_ACTIONS: readonly [
	ConnectorBrowser,
	string,
	LucideIcon,
	string,
][] = [
	["mail", "Open Emails", Mail, OUTLOOK_TONE],
	["calendar", "Open Calendar", CalendarDays, OUTLOOK_TONE],
	["onedrive", "Open OneDrive", Cloud, ONEDRIVE_TONE],
	["teams-chats", "Open Teams Chats", MessagesSquare, TEAMS_TONE],
	["teams-channels", "Open Teams Channels", Hash, TEAMS_TONE],
	["teams-files", "Open Teams Files", Files, TEAMS_TONE],
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
	return BROWSER_ACTIONS.map(([browser, label, icon, iconClassName]) => ({
		id: browser,
		label,
		icon,
		iconClassName,
		onSelect: () =>
			returnToBrowser(browser, "microsoft", undefined, returnFocusId),
	}));
}
