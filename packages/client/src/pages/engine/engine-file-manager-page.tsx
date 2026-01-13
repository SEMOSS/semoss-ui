import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { EngineWorkspace } from "@/components/engine-workspace/engine-workspace";

export const EngineFileManagerPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

	return (
		<div className="h-[60vh] w-full overflow-hidden">
			<InsightProvider>
				<EngineWorkspace engine={engineId || ""} />
			</InsightProvider>
		</div>
	);
};
