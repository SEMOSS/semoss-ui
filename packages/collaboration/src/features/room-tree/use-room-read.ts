import { useContext, useEffect } from "react";
import { RoomReadContext } from "./room-read.context";

// RoomWorkspace shows chat beside an open workbench at its md breakpoint.
const VISIBLE_CONVERSATION_QUERY = "(min-width: 48rem)";

/** Keep a loaded room read only while its transcript and browser tab are visible. */
export function useRoomRead(
	roomId: string,
	isVisible: boolean,
	isTranscriptHiddenOnMobile = false,
): void {
	const viewRoom = useContext(RoomReadContext)?.viewRoom;
	useEffect(() => {
		if (!viewRoom || !roomId || !isVisible) return;
		const media = isTranscriptHiddenOnMobile
			? window.matchMedia?.(VISIBLE_CONVERSATION_QUERY)
			: null;
		let release: (() => void) | undefined;
		function updateVisibility(): void {
			const canRead =
				document.visibilityState === "visible" &&
				(!isTranscriptHiddenOnMobile || media?.matches === true);
			if (canRead) {
				if (!release) release = viewRoom?.(roomId);
			} else if (release) {
				release();
				release = undefined;
			}
		}
		updateVisibility();
		document.addEventListener("visibilitychange", updateVisibility);
		media?.addEventListener("change", updateVisibility);
		return () => {
			document.removeEventListener("visibilitychange", updateVisibility);
			media?.removeEventListener("change", updateVisibility);
			release?.();
		};
	}, [viewRoom, roomId, isVisible, isTranscriptHiddenOnMobile]);
}
