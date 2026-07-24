import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { StorageWorkbench } from "@/components/workbench";

export const EngineStorageWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<StorageWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
