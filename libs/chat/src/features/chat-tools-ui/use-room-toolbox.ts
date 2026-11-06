import { useCallback, useEffect } from "react";
import { readRoomToolFile } from "@semoss/sdk";
import type { RoomUiStore } from "../workbench/room-ui.store";
import { type ToolsRead, useToolsRead } from "./use-tools-read";

/**
 * The tools in a room's own toolbox, read from its tool file. Read again
 * when the room binds to another insight, and whenever `revision` changes,
 * such as when the room's connectors do.
 *
 * @param room - The room.
 * @param revision - Changes whenever the toolbox may have.
 * @return The tools, how the read went, and a way to read them again.
 */
export const useRoomToolbox = (
	room: RoomUiStore,
	revision: string,
): ToolsRead => {
	const { insightId } = room;
	const read = useCallback(() => readRoomToolFile(room), [room]);
	const toolbox = useToolsRead(insightId, read);
	const { load } = toolbox;

	// biome-ignore lint/correctness/useExhaustiveDependencies: revision only signals that the tool file may have changed
	useEffect(() => {
		load();
	}, [load, revision]);

	return toolbox;
};
