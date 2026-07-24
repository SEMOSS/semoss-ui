import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { ModelWorkbench } from "@/components/workbench";

export const EngineModelWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<ModelWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
