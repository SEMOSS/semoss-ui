import { useCallback, useEffect, useState } from "react";
import type { RoomStore } from "@/stores/room/room.store";
import { loadRoomToolbox } from "./connectors/connector-tools";
import type { ChatToolInfo } from "./tools/chat-tool-info";

/** What {@link useRoomToolbox} returns. */
export interface UseRoomToolboxResult {
	status: "loading" | "ready" | "error";
	/** The toolbox's tools, each with the reactor it runs. */
	tools: (ChatToolInfo & { reactor: string })[];
	/** Read the toolbox again. */
	reload: () => void;
}

/**
 * The tools in a room's own toolbox, read from its tool file. Read again
 * whenever `revision` changes, such as when the room's connectors do.
 *
 * @param room - The room.
 * @param revision - Changes whenever the toolbox may have.
 * @return The tools and how the read went.
 */
export const useRoomToolbox = (
	room: RoomStore,
	revision: unknown,
): UseRoomToolboxResult => {
	const [status, setStatus] =
		useState<UseRoomToolboxResult["status"]>("loading");
	const [tools, setTools] = useState<UseRoomToolboxResult["tools"]>([]);
	const [reloadCount, setReloadCount] = useState(0);

	// biome-ignore lint/correctness/useExhaustiveDependencies: revision and reloadCount only ask for a new read
	useEffect(() => {
		let isCancelled = false;
		setStatus("loading");
		loadRoomToolbox(room).then(
			(next) => {
				if (!isCancelled) {
					setTools(next);
					setStatus("ready");
				}
			},
			() => {
				if (!isCancelled) {
					setStatus("error");
				}
			},
		);
		return () => {
			isCancelled = true;
		};
	}, [room, revision, reloadCount]);

	const reload = useCallback(() => {
		setReloadCount((count) => count + 1);
	}, []);

	return { status: status, tools: tools, reload: reload };
};
