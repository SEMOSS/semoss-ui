import {
	type FileExplorerApi,
	type FileMode,
	useFileExplorer,
} from "@semoss/shared";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { FileExplorerPane } from "../files";

/** Module scope: the insight scope carries no parameters of its own. */
const INSIGHT_MODE: FileMode = { type: "INSIGHT" };

export interface ProjectInsightExplorerProps {
	/** The panel instance the chrome control belongs to. */
	id: WorkbenchPanelId;
	/** The panel's `setValue`, for publishing the explorer to its control. */
	setValue: (value: FileExplorerApi) => void;
}

/**
 * The insight-scoped file tree.
 *
 * Split out from `ProjectInsightExplorerPanel` because `useFileExplorer` reads
 * the ambient insight, so it has to run *inside* the panel's
 * `InsightProvider` rather than above it.
 *
 * Selecting a file does nothing on purpose — this pane is for browsing and
 * uploading into the terminal's workspace, and the terminal is what opens
 * files.
 */
export const ProjectInsightExplorer: React.FC<ProjectInsightExplorerProps> = ({
	id,
	setValue,
}) => {
	const explorer = useFileExplorer({ mode: INSIGHT_MODE });

	return <FileExplorerPane id={id} explorer={explorer} setValue={setValue} />;
};
