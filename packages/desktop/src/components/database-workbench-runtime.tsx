import { useEffect, useState } from "react";
import type { StoreApi } from "zustand";
import {
	createDatabaseWorkbenchStore,
	type DatabaseWorkbenchState,
} from "@semoss/engine-workbench";
import { useWorkbenchStoreApi } from "@semoss/workbench";
import type { CatalogItem } from "@/types";
import { DatabaseWorkbenchStateProvider } from "./database-workbench.context";
import { DatabaseWorkbenchDock } from "./database-workbench-dock";

interface DatabaseWorkbenchRuntimeProps {
	item: CatalogItem;
}

export const DatabaseWorkbenchRuntime = ({
	item,
}: DatabaseWorkbenchRuntimeProps) => {
	const workbench = useWorkbenchStoreApi();
	const [databaseStore] = useState<StoreApi<DatabaseWorkbenchState>>(() =>
		createDatabaseWorkbenchStore({ workbench }),
	);

	useEffect(() => {
		void databaseStore.getState().initialize(item.id);
	}, [databaseStore, item.id]);

	return (
		<DatabaseWorkbenchStateProvider store={databaseStore}>
			<DatabaseWorkbenchDock />
		</DatabaseWorkbenchStateProvider>
	);
};
