import { useEffect, useState } from "react";
import type { StoreApi } from "zustand";
import type { AssistantState } from "@/stores/assistant";
import { createAssistantStore } from "@/stores/assistant";
import { useWorkbench } from "./use-workbench";
import { useWorkbenchStoreApi } from "./use-workbench-store-api";

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
 * @return The assistant store for this workbench instance.
 */
export const useAssistantStore = (): StoreApi<AssistantState> => {
	const workbench = useWorkbenchStoreApi();
	const cacheKey = useWorkbench((state) => state.layout.cacheKey);
	const [store] = useState(() =>
		createAssistantStore({ workbench, cacheKey }),
	);

	useEffect(() => () => store.getState().destroy(), [store]);

	return store;
};
