import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { GuardrailWorkbench } from "@/components/workbench";

export const EngineGuardrailWorkbenchPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<InsightProvider>
			<GuardrailWorkbench engine={engineId || ""} />
		</InsightProvider>
	);
};
