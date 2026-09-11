import { useMemo } from "react";
import { Workbench } from "@semoss/workbench";
import { useProject } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { FILE_PANEL_COMPONENTS } from "../../files";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";

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
const NOTEBOOK_VIEW_WORKBENCH_COMPONENTS: Record<
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
export const NotebookViewWorkbench: React.FC = () => {
	const { project } = useProject();
	const workbenchLayout = useMemo(
		() => createNotebookViewWorkbenchLayout(project.project_id),
		[project.project_id],
	);

	return (
		<Workbench
			layout={workbenchLayout}
			components={NOTEBOOK_VIEW_WORKBENCH_COMPONENTS}
		/>
	);
};
