import { useCallback, useState } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { Env } from "@semoss/sdk/react";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import {
	CALENDAR_BROWSER_PANEL,
	EMAIL_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
	TOPIC_WORK_PANEL_TYPE,
} from "@/features/room-connectors/room-connectors.constants";

/** The tabs the rail starts with; one opened on demand is gone after a reload. */
const REMEMBERED_TABS: readonly string[] = [
	FILE_PANEL_TYPES.FILE_EXPLORER,
	EMAIL_BROWSER_PANEL,
	CALENDAR_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
	TOPIC_WORK_PANEL_TYPE,
];

/** The tab id when it is one the rail starts with, otherwise none. */
function rememberedTab(id: string | null | undefined): string | null {
	return id && REMEMBERED_TABS.includes(id) ? id : null;
}

/** What the owner left in one chat's side drawer. */
export interface RoomDockPreference {
	/** False until the owner has opened the drawer in this chat. */
	isOpen: boolean;
	/** The rail tab showing when the drawer was left open; null for the bare rail or a tab that cannot come back. */
	activeTab: string | null;
	/** Remembers the choice, for this session only if storage is blocked. A null tab clears it, and closing the drawer forgets the tab too. */
	save: (next: { isOpen?: boolean; activeTab?: string | null }) => void;
}

/** The storage key for one chat, isolated by deployment and signed-in account. */
export function roomDockStorageKey(
	account: string,
	deployment: string,
	roomId: string,
): string {
	return `semoss:collaboration:room-dock:v1:${encodeURIComponent(deployment)}:${encodeURIComponent(account)}:${encodeURIComponent(roomId)}`;
}

/** Stored beside the open flag, so one malformed value cannot reset the other. */
const activeTabKey = (key: string) => `${key}:activeTab`;

/** Reads what was saved; unreadable storage reads as closed with no tab. */
function readPreference(key: string) {
	if (!key) return { key, isOpen: false, activeTab: null };
	try {
		return {
			key,
			isOpen: window.localStorage.getItem(key) === "true",
			activeTab: rememberedTab(
				window.localStorage.getItem(activeTabKey(key)),
			),
		};
	} catch {
		return { key, isOpen: false, activeTab: null };
	}
}

/** The owner's remembered side drawer for one chat. */
export function useRoomDockPreference(roomId: string): RoomDockPreference {
	const session = useOptionalCollaborationSession();
	const account = session
		? session.state.profile.email || session.state.profile.id
		: "";
	const key =
		account && roomId
			? roomDockStorageKey(
					account,
					`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
					roomId,
				)
			: "";
	const [state, setState] = useState(() => readPreference(key));
	let current = state;
	if (state.key !== key) {
		// reset during render so a new account or chat never sees the last one's choice
		current = readPreference(key);
		setState(current);
	}

	const save = useCallback(
		(next: { isOpen?: boolean; activeTab?: string | null }) => {
			// no account or chat to remember it for
			if (!key) return;
			if (next.isOpen === false) {
				setState({ key, isOpen: false, activeTab: null });
				try {
					window.localStorage.removeItem(key);
					window.localStorage.removeItem(activeTabKey(key));
				} catch {
					// storage is blocked; the choice holds for this session
				}
				return;
			}
			const tab =
				next.activeTab === undefined
					? undefined
					: rememberedTab(next.activeTab);
			setState((previous) => ({
				key,
				isOpen: next.isOpen ?? previous.isOpen,
				activeTab: tab === undefined ? previous.activeTab : tab,
			}));
			try {
				if (next.isOpen) window.localStorage.setItem(key, "true");
				if (tab === null)
					window.localStorage.removeItem(activeTabKey(key));
				else if (tab !== undefined)
					window.localStorage.setItem(activeTabKey(key), tab);
			} catch {
				// storage is blocked; the choice holds for this session
			}
		},
		[key],
	);

	return { isOpen: current.isOpen, activeTab: current.activeTab, save };
}
