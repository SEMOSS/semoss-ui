import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ToolWorkbenchContextValue } from "@/features/tools/types/tool-workbench";
import { roomWorkbenchTriggerId } from "./room-workbench-trigger-id";
import { useRoomDockPreference } from "./use-room-dock-preference";

/**
 * Reopens a chat's side drawer the way the owner left it, once per visit, and remembers what they do with it.
 * A drawer that opened by itself, for a file or a tool, is not remembered.
 */
export function useRoomDockMemory({
	roomId,
	isEnabled,
	isOpen,
	openWorkbench,
	store,
}: {
	roomId: string;
	/** False for a room with no drawer, and on a phone, where it covers the chat. */
	isEnabled: boolean;
	isOpen: boolean;
	openWorkbench: ToolWorkbenchContextValue["openWorkbench"];
	store: ToolWorkbenchContextValue["store"];
}): {
	/** Call after the owner opens the drawer with the header toggle. */
	rememberOpened: () => void;
} {
	// useIsMobile reads wide until its first effect, so isEnabled is trusted from the second render
	const [isScreenKnown, setIsScreenKnown] = useState(false);
	useEffect(() => {
		setIsScreenKnown(true);
	}, []);
	const remembersDock = isEnabled && isScreenKnown;
	const {
		isOpen: isSavedOpen,
		activeTab: savedTab,
		save,
	} = useRoomDockPreference(roomId);
	// the drawer reopens at most once per visit
	const hasSettled = useRef(false);
	const wasOpen = useRef(isOpen);
	const activeTab = useSyncExternalStore(
		store.subscribe,
		() => store.getState().layout.borders.left.activeId,
		() => null,
	);

	useEffect(() => {
		if (hasSettled.current || !remembersDock) return;
		hasSettled.current = true;
		if (isSavedOpen && !isOpen) {
			const { panels, actions } = store.getState().layout;
			if (savedTab && panels[savedTab])
				actions.activatePanel({ kind: "border", id: "left" }, savedTab);
			openWorkbench(undefined, roomWorkbenchTriggerId(roomId));
		}
	}, [
		remembersDock,
		isSavedOpen,
		savedTab,
		isOpen,
		openWorkbench,
		roomId,
		store,
	]);

	// the tab is kept only with a drawer the owner left open
	useEffect(() => {
		if (!remembersDock || !isOpen || !isSavedOpen) return;
		save({ activeTab });
	}, [remembersDock, isOpen, isSavedOpen, activeTab, save]);

	// closing it, by the toggle or the dock's own button, is the owner's choice
	useEffect(() => {
		const wasOpenBefore = wasOpen.current;
		wasOpen.current = isOpen;
		if (!wasOpenBefore || isOpen) return;
		hasSettled.current = true;
		if (remembersDock) save({ isOpen: false });
	}, [isOpen, remembersDock, save]);

	return {
		rememberOpened: () => {
			if (remembersDock) save({ isOpen: true });
		},
	};
}
