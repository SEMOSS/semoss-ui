import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { FunctionWorkbench } from "@/components/workbench";

export const EngineFunctionWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<FunctionWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
