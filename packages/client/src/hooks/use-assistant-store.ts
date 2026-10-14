import { useEffect, useRef } from "react";
import type { StoreApi } from "zustand";
import { useWorkbenchStoreApi } from "@semoss/workbench";
import type { AssistantState } from "@/stores/assistant";
import { createAssistantStore } from "@/stores/assistant";

/**
 * Create one assistant store bound to the nearest workbench, and tear it down
 * when the workbench unmounts.
 *
 * Only the lifecycle lives here. The caller still wraps its tree in
 * `AssistantStoreProvider` and owns its own `configure()` effect, because what
 * a workbench tells its assistant — prompt, tools, run params — is the part
 * worth reading at the call site.
 *
 * `destroy()` rather than `dispose()`: the assistant panel calls `dispose()` on
 * every insight change to drop that insight's run watchers, so it must not take
 * the notification subscription with it. That teardown belongs to the store's
 * lifetime, which is this hook's.
 *
 * @name useAssistantStore
 * @param workbenchId - Which workbench this assistant belongs to. It reaches
 * the server: rooms are tagged with it and conversation history is filtered by
 * it, so it must be the same string across visits to the same workbench.
 * @return The assistant store for this workbench instance.
 */
export const useAssistantStore = (
	workbenchId: string,
): StoreApi<AssistantState> => {
	const workbench = useWorkbenchStoreApi();

	// Rebuilt when the id changes, not just on mount: the id is what scopes
	// this assistant's conversations server-side, and a store still holding
	// the previous one would quietly file rooms under the wrong workbench.
	const ref = useRef<{
		workbenchId: string;
		store: StoreApi<AssistantState>;
	} | null>(null);
	if (!ref.current || ref.current.workbenchId !== workbenchId) {
		ref.current?.store.getState().destroy();
		ref.current = {
			workbenchId,
			store: createAssistantStore({ workbench, workbenchId }),
		};
	}
	const store = ref.current.store;

	useEffect(() => () => store.getState().destroy(), [store]);

	return store;
};
