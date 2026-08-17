import type { WorkbenchChatSliceState } from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/**
 * Typed accessor for the base `chat` slice merged into every workbench store,
 * used to drive the CHAT border panel's system prompt, MCP servers, and tool
 * handlers from workbench state instead of static FlexLayout tab config.
 */
export const useWorkbenchChatConfig = <T>(
	selector: (state: WorkbenchChatSliceState["chat"]) => T,
): T => useWorkbench((state) => selector(state.chat));
