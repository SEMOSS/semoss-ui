import { FileTextIcon } from "lucide-react";
import { FileTable } from "@/components/settings";
import { useEngine } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";

/**
 * Vector workbench panel that manages the engine's documents through the shared
 * FileTable (upload, embed, list, delete). Rendered inside the workbench's
 * InsightProvider so its pixel calls share a single insight.
 */
const VectorDocumentsPanel: React.FC = () => {
	const { engine, permission } = useEngine();
	const readOnly = !(permission === "OWNER" || permission === "EDIT");

	return (
		<div className="flex h-full w-full flex-col overflow-auto p-4">
			<FileTable id={engine.engine_id} readOnly={readOnly} />
		</div>
	);
};

/**
 * Blueprint for the vector documents panel. keepAlive: the file table's
 * state survives tab switches.
 */
export const VECTOR_DOCUMENTS_PANEL: WorkbenchPanelConfig = {
	name: "Documents",
	helpText: "Documents",
	icon: ({ className }) => <FileTextIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: VectorDocumentsPanel,
};
