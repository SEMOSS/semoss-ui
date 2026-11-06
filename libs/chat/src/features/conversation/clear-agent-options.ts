import type { RoomUiStore } from "../workbench/room-ui.store";

/** Clears inherited agent configuration without dropping manually added context. */
export function clearAgentOptions(
	options: RoomUiStore["options"],
): RoomUiStore["options"] {
	return {
		...options,
		workspace: undefined,
		instructions: "",
		predefinedPrompts: [],
		mcp: options.mcp.filter((item) => !item.fromWorkspace),
		harnessType: undefined,
	};
}
