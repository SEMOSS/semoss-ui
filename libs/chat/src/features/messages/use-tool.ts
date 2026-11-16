import { useStoreSelector } from "@semoss/utility/react/use-store-selector";
import type { ToolSnapshot, ToolStore } from "./tool.store";

/**
 * Read a tool call and re-render when it changes. Without a selector, every
 * change re-renders, so the store's derived reads (`json`, `displayName`,
 * `isResolved`) stay current during render.
 *
 * @param tool - The call.
 * @param selector - What to read; the whole snapshot when left out.
 * @returns The selection.
 */
export const useTool = <T = ToolSnapshot>(
	tool: ToolStore,
	selector: (snapshot: ToolSnapshot) => T = (snapshot) =>
		snapshot as unknown as T,
): T => useStoreSelector(tool, selector);
