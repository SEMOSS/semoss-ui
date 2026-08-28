import { useStore } from "zustand";
import type { ModelChatStoreInterface } from "@/stores/workbench/model";
import { getModelChatStore } from "@/stores/workbench/model";
import { useWorkbench } from "./use-workbench";

/**
 * Typed accessor for the dedicated chat store a `ModelWorkbench` attaches to
 * its workbench store via `actions.attachDomainStore`. Only valid underneath a
 * `ModelWorkbench`.
 *
 * The narrowing itself lives in `getModelChatStore` so the untyped
 * `domainStore` attachment is cast in exactly one place, shared with the
 * non-React callers (a blueprint's `commands` / `menuItems` factory).
 *
 * @name useModelChat
 * @param selector - Selects the slice of chat state to subscribe to.
 * @return The selected slice.
 */
export const useModelChat = <T>(
	selector: (state: ModelChatStoreInterface) => T,
): T => {
	// Subscribed, not read once: the panel can mount before the domain
	// workbench's effect attaches the store, and must re-render when it does.
	const domainStore = useWorkbench(getModelChatStore);
	if (!domainStore) {
		throw new Error(
			"useModelChat must be used underneath a ModelWorkbench that attached its domain store",
		);
	}

	return useStore(domainStore, selector);
};
