import { act, cleanup, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RoomReadContext } from "./room-read.context";
import { useRoomRead } from "./use-room-read";

interface ReadProps {
	roomId: string;
	isVisible: boolean;
	isTranscriptHiddenOnMobile?: boolean;
}

let visibility: DocumentVisibilityState = "visible";
let isWide = true;
const mediaListeners = new Set<() => void>();
const activeViews = new Map<symbol, string>();
const releaseRoom = vi.fn<(roomId: string) => void>();
const viewRoom = vi.fn((roomId: string): (() => void) => {
	const token = Symbol(roomId);
	activeViews.set(token, roomId);
	return () => {
		activeViews.delete(token);
		releaseRoom(roomId);
	};
});

function ReadOwner({ children }: { children: ReactNode }) {
	return (
		<RoomReadContext.Provider value={{ viewRoom }}>
			{children}
		</RoomReadContext.Provider>
	);
}

/** Exercise visibility subscriptions without starting any room transport. */
function renderRead(initialProps: ReadProps) {
	return renderHook(
		({ roomId, isVisible, isTranscriptHiddenOnMobile }: ReadProps) =>
			useRoomRead(roomId, isVisible, isTranscriptHiddenOnMobile),
		{ initialProps, wrapper: ReadOwner },
	);
}

function changeVisibility(next: DocumentVisibilityState): void {
	act(() => {
		visibility = next;
		document.dispatchEvent(new Event("visibilitychange"));
	});
}

function changeWidth(matches: boolean): void {
	act(() => {
		isWide = matches;
		for (const notify of mediaListeners) notify();
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	activeViews.clear();
	mediaListeners.clear();
	visibility = "visible";
	isWide = true;
	vi.spyOn(document, "visibilityState", "get").mockImplementation(
		() => visibility,
	);
	vi.stubGlobal("matchMedia", (query: string) => ({
		get matches() {
			return query === "(min-width: 48rem)" && isWide;
		},
		addEventListener: (_event: string, listener: () => void) =>
			mediaListeners.add(listener),
		removeEventListener: (_event: string, listener: () => void) =>
			mediaListeners.delete(listener),
	}));
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("leaves standalone room surfaces without a read-state owner unchanged", () => {
	const { unmount } = renderHook(() => useRoomRead("standalone", true, true));
	changeVisibility("hidden");
	changeWidth(false);
	unmount();
	expect(viewRoom).not.toHaveBeenCalled();
	expect(mediaListeners.size).toBe(0);
});

it("waits for an actual loaded room and releases when the transcript stops being visible", () => {
	const { rerender } = renderRead({ roomId: "", isVisible: true });
	expect(viewRoom).not.toHaveBeenCalled();
	rerender({ roomId: "room-one", isVisible: false });
	expect(viewRoom).not.toHaveBeenCalled();
	rerender({ roomId: "room-one", isVisible: true });
	expect(viewRoom).toHaveBeenCalledExactlyOnceWith("room-one");
	expect([...activeViews.values()]).toEqual(["room-one"]);
	rerender({ roomId: "room-one", isVisible: false });
	expect(releaseRoom).toHaveBeenCalledExactlyOnceWith("room-one");
	changeVisibility("visible");
	expect(activeViews.size).toBe(0);
	expect(viewRoom).toHaveBeenCalledOnce();
});

it("keeps one view through normal updates and releases the previous room on navigation", () => {
	const { rerender, unmount } = renderRead({
		roomId: "room-one",
		isVisible: true,
	});
	rerender({ roomId: "room-one", isVisible: true });
	changeVisibility("visible");
	expect(viewRoom).toHaveBeenCalledOnce();
	rerender({ roomId: "room-two", isVisible: true });
	expect(releaseRoom).toHaveBeenCalledExactlyOnceWith("room-one");
	expect([...activeViews.values()]).toEqual(["room-two"]);
	unmount();
	expect(releaseRoom).toHaveBeenLastCalledWith("room-two");
	expect(activeViews.size).toBe(0);
	changeVisibility("visible");
	expect(viewRoom).toHaveBeenCalledTimes(2);
});

it("keeps background-tab activity unread until the loaded transcript is visible again", () => {
	visibility = "hidden";
	const { unmount } = renderRead({ roomId: "room-one", isVisible: true });
	expect(viewRoom).not.toHaveBeenCalled();
	changeVisibility("visible");
	expect([...activeViews.values()]).toEqual(["room-one"]);
	changeVisibility("hidden");
	expect(releaseRoom).toHaveBeenCalledExactlyOnceWith("room-one");
	expect(activeViews.size).toBe(0);
	changeVisibility("hidden");
	expect(viewRoom).toHaveBeenCalledOnce();
	changeVisibility("visible");
	expect(viewRoom).toHaveBeenCalledTimes(2);
	expect([...activeViews.values()]).toEqual(["room-one"]);
	unmount();
	expect(releaseRoom).toHaveBeenCalledTimes(2);
});

it("tracks the md breakpoint while an open workbench hides the mobile transcript", () => {
	isWide = false;
	const { rerender, unmount } = renderRead({
		roomId: "room-one",
		isVisible: true,
		isTranscriptHiddenOnMobile: true,
	});
	expect(viewRoom).not.toHaveBeenCalled();
	expect(mediaListeners.size).toBe(1);
	changeWidth(true);
	expect([...activeViews.values()]).toEqual(["room-one"]);
	changeWidth(true);
	expect(viewRoom).toHaveBeenCalledOnce();
	changeWidth(false);
	expect(releaseRoom).toHaveBeenCalledExactlyOnceWith("room-one");
	changeVisibility("visible");
	expect(activeViews.size).toBe(0);
	rerender({
		roomId: "room-one",
		isVisible: true,
		isTranscriptHiddenOnMobile: false,
	});
	expect([...activeViews.values()]).toEqual(["room-one"]);
	expect(mediaListeners.size).toBe(0);
	unmount();
	changeWidth(true);
	expect(activeViews.size).toBe(0);
	expect(viewRoom).toHaveBeenCalledTimes(2);
});

it("does not mark a hidden tab read when its workbench becomes wide", () => {
	visibility = "hidden";
	isWide = false;
	renderRead({
		roomId: "room-one",
		isVisible: true,
		isTranscriptHiddenOnMobile: true,
	});
	changeWidth(true);
	expect(viewRoom).not.toHaveBeenCalled();
	changeVisibility("visible");
	expect(viewRoom).toHaveBeenCalledExactlyOnceWith("room-one");
});

it("keeps one active registration through Strict Mode and cleans up every subscription", () => {
	const { unmount } = renderHook(() => useRoomRead("room-one", true, true), {
		wrapper: ({ children }) => (
			<StrictMode>
				<ReadOwner>{children}</ReadOwner>
			</StrictMode>
		),
	});
	expect([...activeViews.values()]).toEqual(["room-one"]);
	expect(mediaListeners.size).toBe(1);
	unmount();
	expect(activeViews.size).toBe(0);
	expect(mediaListeners.size).toBe(0);
	expect(releaseRoom).toHaveBeenCalledTimes(viewRoom.mock.calls.length);
});
