import { Navigate } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { VectorWorkbench } from "@/components/workbench";
import { useEngine } from "@/hooks";

export const EngineVectorWorkbenchPage = () => {
	const { engine, permission, catalog } = useEngine();

	if (permission === "DISCOVERABLE") {
		return <Navigate to={`${catalog.path}/${engine.engine_id}`} replace />;
	}

	return (
		<InsightProvider>
			<VectorWorkbench />
		</InsightProvider>
	);
};
