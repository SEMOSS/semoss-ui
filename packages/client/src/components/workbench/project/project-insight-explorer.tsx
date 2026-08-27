import { useEffect } from "react";
import {
	FileExplorer,
	type FileExplorerApi,
	FileExplorerHeader,
	type FileMode,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import { useWorkbenchControl } from "@/hooks";
import type { WorkbenchPanelId } from "@/stores/workbench";
import { FileExplorerControl } from "../file-explorer-control";

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

	// publish the explorer for the panel's chrome control. `explorer` is
	// identity-stable, so this runs once; `setValue` is intentionally not a
	// dependency — it takes a new identity whenever the value it writes does,
	// which would loop.
	// biome-ignore lint/correctness/useExhaustiveDependencies: see above
	useEffect(() => setValue(explorer), [explorer]);
	useWorkbenchControl(id, FileExplorerControl);

	return (
		<FileExplorer
			explorer={explorer}
			header={<FileExplorerHeader explorer={explorer} />}
			newFileOverlay={NewFileOverlay}
		/>
	);
};
