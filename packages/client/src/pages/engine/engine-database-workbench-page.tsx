import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { DatabaseWorkbench } from "@/components/workbench";

export const EngineDatabaseWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<DatabaseWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
