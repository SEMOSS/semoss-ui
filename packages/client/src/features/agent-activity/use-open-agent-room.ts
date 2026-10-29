import { type RefObject, useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { scrollAncestorsToTop } from "@semoss/utility/browser";
import type { AgentRunRoom } from "@/api/agent-runs";
import { agentRoomKey } from "./agent-room-table";

/** A room shown in place of the list */
export interface OpenAgentRoom {
	/** The room, as the list has it */
	room: AgentRunRoom;
	/** The one run to load, such as from a link to it, or null for every run */
	runId: string | null;
}

export interface UseOpenAgentRoomResult {
	/** Goes on the element holding the list and the room, whose ancestors scroll */
	rootRef: RefObject<HTMLDivElement | null>;
	/** The room shown, or null while the list is */
	openRoom: OpenAgentRoom | null;
	/** Shows a room from the top of the page, keeping where the list was */
	open: (room: AgentRunRoom, runId?: string | null) => void;
	/** Goes back to the list, scrolled where it was, with focus on the room left */
	back: () => void;
	/** Marks the room shown closed, once closing it ran */
	markClosed: () => void;
}

/**
 * Shows one room in place of a room list and back again. A room opens from
 * the top of the page, and Back returns to the list where it was scrolled, with
 * focus on the room's row (`data-room-key` from `AgentRoomTable`).
 *
 * @returns The room shown and the actions that open it, close it and go back.
 */
export const useOpenAgentRoom = (): UseOpenAgentRoomResult => {
	const [openRoom, setOpenRoom] = useState<OpenAgentRoom | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const restoreListScroll = useRef<(() => void) | null>(null);

	// stable, so a page can open a room from a link in an effect
	const open = useCallback(
		(room: AgentRunRoom, runId: string | null = null) => {
			// a room opened over another one, from a link, keeps where the list was
			if (!restoreListScroll.current) {
				restoreListScroll.current = scrollAncestorsToTop(
					rootRef.current,
				);
			}
			setOpenRoom({ room, runId });
		},
		[],
	);

	const back = () => {
		const room = openRoom?.room ?? null;
		// the list renders first, so it has its height again to scroll back over
		flushSync(() => setOpenRoom(null));
		restoreListScroll.current?.();
		restoreListScroll.current = null;
		if (!room) {
			return;
		}
		const rows = Array.from(
			rootRef.current?.querySelectorAll<HTMLElement>("[data-room-key]") ??
				[],
		);
		// a room opened from a link has no user yet, so its row is found by its id
		const row =
			rows.find((each) => each.dataset.roomKey === agentRoomKey(room)) ??
			rows.find((each) =>
				each.dataset.roomKey?.startsWith(`${room.roomId}:`),
			);
		row?.focus({ preventScroll: true });
	};

	const markClosed = () =>
		setOpenRoom((previous) =>
			previous
				? { ...previous, room: { ...previous.room, isClosed: true } }
				: previous,
		);

	return { rootRef, openRoom, open, back, markClosed };
};
