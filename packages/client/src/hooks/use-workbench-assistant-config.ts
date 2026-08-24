import type { WorkbenchAssistantSliceState } from "@/stores/workbench";
import { useWorkbench } from "./use-workbench";

/**
 * Typed accessor for the base `assistant` slice merged into every workbench store,
 * used to drive the ASSISTANT border panel's system prompt and room preparation
 * from workbench state instead of static FlexLayout tab config.
 */
export const useWorkbenchAssistantConfig = <T>(
	selector: (state: WorkbenchAssistantSliceState["assistant"]) => T,
): T => useWorkbench((state) => selector(state.assistant));
