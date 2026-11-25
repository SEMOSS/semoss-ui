import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import { Env } from "@semoss/sdk/react";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import {
	CALENDAR_BROWSER_PANEL,
	EMAIL_BROWSER_PANEL,
	ONEDRIVE_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
} from "@/features/room-connectors/room-connectors.constants";
import {
	roomDockStorageKey,
	useRoomDockPreference,
} from "./use-room-dock-preference";

const initial = createInitialCollaborationState();
const owner = initial.profile.email;
const room = "room-1";
const keyFor = (account: string, roomId = room) =>
	roomDockStorageKey(
		account,
		`${window.location.origin}${Env.MODULE}${window.location.pathname}`,
		roomId,
	);
const tabKeyFor = (account: string, roomId = room) =>
	`${keyFor(account, roomId)}:activeTab`;

/** The rail's own tabs, which come back after a reload. */
const RAIL_TABS = [
	FILE_PANEL_TYPES.FILE_EXPLORER,
	EMAIL_BROWSER_PANEL,
	CALENDAR_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
];

/** A signed-in collaboration session for the given account. */
function signedInAs(email: string) {
	const state = { ...initial, profile: { ...initial.profile, email } };
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<CollaborationSessionProvider initialState={state}>
				{children}
			</CollaborationSessionProvider>
		);
	};
}

beforeEach(() => {
	localStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

it("is closed until the owner has opened the drawer in this chat", () => {
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	expect(result.current.isOpen).toBe(false);
	expect(result.current.activeTab).toBeNull();
});

it("reads a saved open or closed drawer, and anything else as closed", () => {
	for (const [stored, expected] of [
		["true", true],
		["false", false],
		["yes", false],
		["1", false],
		["", false],
	] as const) {
		localStorage.setItem(keyFor(owner), stored);
		const { result, unmount } = renderHook(
			() => useRoomDockPreference(room),
			{ wrapper: signedInAs(owner) },
		);
		expect(result.current.isOpen).toBe(expected);
		unmount();
	}
});

it("remembers an open drawer under the owner's own key for this chat", () => {
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	act(() => result.current.save({ isOpen: true }));
	expect(result.current.isOpen).toBe(true);
	expect(localStorage.getItem(keyFor(owner))).toBe("true");
});

it("leaves nothing behind when the drawer is closed, since closed is how every chat starts", () => {
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	act(() => result.current.save({ isOpen: true }));
	act(() => result.current.save({ activeTab: EMAIL_BROWSER_PANEL }));
	expect(localStorage.length).toBe(2);

	act(() => result.current.save({ isOpen: false }));
	expect(result.current.isOpen).toBe(false);
	expect(result.current.activeTab).toBeNull();
	expect(localStorage.length).toBe(0);
});

it("keeps each account's choice to itself", () => {
	localStorage.setItem(keyFor(owner), "true");
	localStorage.setItem(tabKeyFor(owner), EMAIL_BROWSER_PANEL);
	const other = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs("someone.else@contoso.example"),
	});
	expect(other.result.current.isOpen).toBe(false);
	expect(other.result.current.activeTab).toBeNull();
	act(() => other.result.current.save({ isOpen: true }));
	other.unmount();

	const again = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	expect(again.result.current.isOpen).toBe(true);
	expect(again.result.current.activeTab).toBe(EMAIL_BROWSER_PANEL);
});

it("keeps each chat's choice to itself, and follows the chat when it changes", () => {
	localStorage.setItem(keyFor(owner, "room-1"), "true");
	localStorage.setItem(tabKeyFor(owner, "room-1"), EMAIL_BROWSER_PANEL);
	const { result, rerender } = renderHook(
		({ roomId }) => useRoomDockPreference(roomId),
		{
			initialProps: { roomId: "room-1" },
			wrapper: signedInAs(owner),
		},
	);
	expect(result.current.isOpen).toBe(true);
	expect(result.current.activeTab).toBe(EMAIL_BROWSER_PANEL);

	// another chat starts closed
	rerender({ roomId: "room-2" });
	expect(result.current.isOpen).toBe(false);
	expect(result.current.activeTab).toBeNull();
	act(() => result.current.save({ isOpen: true }));
	expect(localStorage.getItem(keyFor(owner, "room-2"))).toBe("true");

	rerender({ roomId: "room-1" });
	expect(result.current.isOpen).toBe(true);
	expect(result.current.activeTab).toBe(EMAIL_BROWSER_PANEL);
});

it("keeps the choice for this session when storage is blocked", () => {
	vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
		throw new Error("blocked");
	});
	vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
		throw new Error("blocked");
	});
	vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
		throw new Error("blocked");
	});
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	expect(result.current.isOpen).toBe(false);
	expect(result.current.activeTab).toBeNull();
	act(() =>
		result.current.save({ isOpen: true, activeTab: EMAIL_BROWSER_PANEL }),
	);
	expect(result.current.isOpen).toBe(true);
	expect(result.current.activeTab).toBe(EMAIL_BROWSER_PANEL);
	act(() => result.current.save({ isOpen: false }));
	expect(result.current.isOpen).toBe(false);
	expect(result.current.activeTab).toBeNull();
});

it("remembers which of the rail's tabs was showing, apart from opening the drawer", () => {
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	expect(result.current.activeTab).toBeNull();

	for (const tab of RAIL_TABS) {
		act(() => result.current.save({ activeTab: tab }));
		expect(result.current.activeTab).toBe(tab);
		expect(localStorage.getItem(tabKeyFor(owner))).toBe(tab);
	}
	expect(result.current.isOpen).toBe(false);
	expect(localStorage.getItem(keyFor(owner))).toBeNull();

	// opening the drawer leaves the remembered tab alone
	act(() => result.current.save({ isOpen: true }));
	expect(result.current.activeTab).toBe(ROOM_TASK_PANEL_TYPE);
});

it("clears the remembered tab for the bare tab rail, and for a tab opened on demand", () => {
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	act(() =>
		result.current.save({ activeTab: FILE_PANEL_TYPES.FILE_EXPLORER }),
	);

	act(() => result.current.save({ activeTab: null }));
	expect(result.current.activeTab).toBeNull();
	expect(localStorage.getItem(tabKeyFor(owner))).toBeNull();

	act(() => result.current.save({ activeTab: EMAIL_BROWSER_PANEL }));
	// a OneDrive browser is not there after a reload, so it is remembered as none
	act(() => result.current.save({ activeTab: ONEDRIVE_BROWSER_PANEL }));
	expect(result.current.activeTab).toBeNull();
	expect(localStorage.getItem(tabKeyFor(owner))).toBeNull();
});

it("reads a saved tab only if it is one the rail starts with", () => {
	for (const [stored, expected] of [
		...RAIL_TABS.map((tab) => [tab, tab] as const),
		[ONEDRIVE_BROWSER_PANEL, null],
		["not-a-tab", null],
		["true", null],
		["", null],
	] as const) {
		localStorage.setItem(tabKeyFor(owner), stored);
		const { result, unmount } = renderHook(
			() => useRoomDockPreference(room),
			{ wrapper: signedInAs(owner) },
		);
		expect(result.current.activeTab).toBe(expected);
		unmount();
	}
});

it("brings back an open drawer saved with no tab on its bare tab rail", () => {
	localStorage.setItem(keyFor(owner), "true");
	const { result } = renderHook(() => useRoomDockPreference(room), {
		wrapper: signedInAs(owner),
	});
	expect(result.current.isOpen).toBe(true);
	expect(result.current.activeTab).toBeNull();
});

it("remembers nothing without a signed-in account, or without a chat", () => {
	const noAccount = renderHook(() => useRoomDockPreference(room));
	act(() =>
		noAccount.result.current.save({
			isOpen: true,
			activeTab: EMAIL_BROWSER_PANEL,
		}),
	);
	expect(noAccount.result.current.isOpen).toBe(false);
	expect(noAccount.result.current.activeTab).toBeNull();

	const noChat = renderHook(() => useRoomDockPreference(""), {
		wrapper: signedInAs(owner),
	});
	act(() =>
		noChat.result.current.save({
			isOpen: true,
			activeTab: EMAIL_BROWSER_PANEL,
		}),
	);
	expect(noChat.result.current.isOpen).toBe(false);
	expect(noChat.result.current.activeTab).toBeNull();
	expect(localStorage.length).toBe(0);
});
