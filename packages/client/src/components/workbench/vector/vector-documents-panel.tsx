import { FileTable } from "@/components/settings";
import { useEngine } from "@/hooks";

/**
 * Vector workbench panel that manages the engine's documents through the shared
 * FileTable (upload, embed, list, delete). Rendered inside the workbench's
 * InsightProvider so its pixel calls share a single insight.
 */
export const VectorDocumentsPanel: React.FC = () => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");

	return (
		<div className="flex h-full w-full flex-col overflow-auto p-4">
			<FileTable id={engine.engine_id} readOnly={readOnly} />
		</div>
	);
};
