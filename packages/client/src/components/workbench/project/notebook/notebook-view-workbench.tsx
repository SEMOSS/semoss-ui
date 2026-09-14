import { useMemo } from "react";
import { useProject } from "@/hooks";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { Workbench } from "../../core";
import {
	FILE_CODE_EDITOR_PANEL,
	FILE_DOWNLOAD_PANEL,
	FILE_EXPLORER_PANEL,
	FILE_IMAGE_VIEWER_PANEL,
	FILE_MARKDOWN_EDITOR_PANEL,
	FILE_MCP_EDITOR_PANEL,
	FILE_NOTEBOOK_EDITOR_PANEL,
	FILE_PDF_VIEWER_PANEL,
	FILE_PPTX_VIEWER_PANEL,
} from "../../files";
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
				type: "PROJECT",
				id: projectId,
				name: NOTEBOOK_NAME,
				path: NOTEBOOK_PATH,
			},
		},
		[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
			...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
			config: {
				type: "PROJECT",
				id: projectId,
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
	[WORKBENCH_COMPONENTS.FILE_EXPLORER]: FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_CODE_EDITOR]: FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_DOWNLOAD]: FILE_DOWNLOAD_PANEL,
	[WORKBENCH_COMPONENTS.FILE_IMAGE_VIEWER]: FILE_IMAGE_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MARKDOWN_EDITOR]: FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_NOTEBOOK_EDITOR]: FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PDF_VIEWER]: FILE_PDF_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_PPTX_VIEWER]: FILE_PPTX_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.FILE_MCP_EDITOR]: FILE_MCP_EDITOR_PANEL,
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
