import { useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import { useCacheState } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import { parseWorkbenchSnapshot, Workbench } from "@semoss/workbench";
import { useProject } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** Only published assets are browsable from the read-only surface. */
const PUBLIC_ROOT_PATH = "/public";

/** The default arrangement: main.ipynb open, the /public files on the left. */
const createNotebookViewWorkbenchLayout = (
	projectId: string,
): WorkbenchLayout => ({
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [NOTEBOOK_EDITOR_ID],
		activeId: NOTEBOOK_EDITOR_ID,
	},
	panels: {
		[NOTEBOOK_EDITOR_ID]: {
			id: NOTEBOOK_EDITOR_ID,
			type: WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR,
			name: NOTEBOOK_NAME,
			canClose: true,
			config: {
				mode: { type: "APP", app: projectId },
				name: NOTEBOOK_NAME,
				path: NOTEBOOK_PATH,
			},
		},
		[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
			...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
			config: {
				mode: { type: "APP", app: projectId },
				initialPath: PUBLIC_ROOT_PATH,
			},
		},
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			size: 400,
		},
	},
});

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const NOTEBOOK_VIEW_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
};

/**
 * Read-only notebook workbench used by the notebook view page and the share
 * page. Shows `main.ipynb` and the published `/public` files without the
 * terminal, assistant, or settings surfaces of the editable workbench.
 */
interface NotebookViewWorkbenchProps {
	/**
	 * Which mount this is. The notebook's own view page and the share page
	 * render the same dock and keep separate arrangements, and nothing inside
	 * the shell tells them apart.
	 */
	variant: "view" | "share";
}

export const NotebookViewWorkbench: React.FC<NotebookViewWorkbenchProps> = ({
	variant,
}) => {
	const { project } = useProject();
	const workbenchLayout = useMemo(
		() => createNotebookViewWorkbenchLayout(project.project_id),
		[project.project_id],
	);

	// This shell is mounted by two pages — the notebook's own view and the
	// share page — and they keep separate arrangements, so the variant is a
	// prop rather than something the shell can work out for itself.
	const [snapshot, onSnapshotChange] = useCacheState<WorkbenchSnapshot>(
		workbenchLayout,
		`workbench-layout--${project.project_id}-${variant}--1`,
		parseWorkbenchSnapshot,
	);

	return <Workbench snapshot={snapshot} onUnmount={onSnapshotChange} />;
};
