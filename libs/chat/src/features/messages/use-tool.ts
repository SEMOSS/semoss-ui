import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ToolStore } from "./tool.store";

/**
 * Read a tool call and re-render when what you read changes.
 *
 * @param tool - The call.
 * @param selector - What to read, through the call's getters (`status`,
 * `json`, `displayName`, ...).
 * @returns The selection.
 */
export const useTool = <T>(
	tool: ToolStore,
	selector: (tool: ToolStore) => T,
): T => useStoreSelector(tool, () => selector(tool));
