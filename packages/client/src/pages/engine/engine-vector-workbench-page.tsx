import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { VectorWorkbench } from "@/components/workbench";

export const EngineVectorWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<VectorWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
