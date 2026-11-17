import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ToolStore } from "./tool.store";

/**
 * Read a tool call and re-render when what you read changes. The call is an
 * entry of its room, so the selector runs on every change to the room, and
 * the component renders only when its selection changes.
 *
 * @param tool - The call.
 * @param selector - What to read, through the call's getters (`status`,
 * `json`, `displayName`, ...).
 * @returns The selection.
 */
export const useTool = <T>(
	tool: ToolStore,
	selector: (tool: ToolStore) => T,
): T => useStoreSelector(tool.room, () => selector(tool));
