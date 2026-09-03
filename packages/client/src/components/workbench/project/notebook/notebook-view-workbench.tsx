import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { Workbench } from "../../core";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import { PROJECT_FILE_CODE_EDITOR_PANEL } from "../project-file-code-editor-panel";
import { PROJECT_FILE_DOWNLOAD_VIEWER_PANEL } from "../project-file-download-viewer-panel";
import { PROJECT_FILE_EXPLORER_PANEL } from "../project-file-explorer-panel";
import { PROJECT_FILE_IMAGE_EDITOR_PANEL } from "../project-file-image-editor-panel";
import { PROJECT_FILE_MARKDOWN_EDITOR_PANEL } from "../project-file-markdown-editor-panel";
import { PROJECT_FILE_NOTEBOOK_EDITOR_PANEL } from "../project-file-notebook-editor-panel";
import { PROJECT_FILE_PDF_EDITOR_PANEL } from "../project-file-pdf-editor-panel";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** Only published assets are browsable from the read-only surface. */
const PUBLIC_ROOT_PATH = "/public";

/** The default arrangement: main.ipynb open, the /public files on the left. */
const NOTEBOOK_VIEW_WORKBENCH_LAYOUT: WorkbenchLayout = {
	version: 1,
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
			type: WORKBENCH_COMPONENTS.PROJECT_FILE_NOTEBOOK_EDITOR,
			name: NOTEBOOK_NAME,
			canClose: true,
			config: {
				name: NOTEBOOK_NAME,
				path: NOTEBOOK_PATH,
				readOnly: true,
			},
		},
		[WORKBENCH_PANEL_RECORDS.PROJECT_FILE_EXPLORER.id]: {
			...WORKBENCH_PANEL_RECORDS.PROJECT_FILE_EXPLORER,
			config: { initialPath: PUBLIC_ROOT_PATH, readOnly: true },
		},
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
			size: 400,
		},
	},
};

/** Blueprints, keyed by type. Module-scope so identities never churn. */
const NOTEBOOK_VIEW_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER]: PROJECT_FILE_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_CODE_EDITOR]:
		PROJECT_FILE_CODE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_DOWNLOAD_VIEWER]:
		PROJECT_FILE_DOWNLOAD_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_IMAGE_EDITOR]:
		PROJECT_FILE_IMAGE_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_MARKDOWN_EDITOR]:
		PROJECT_FILE_MARKDOWN_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_NOTEBOOK_EDITOR]:
		PROJECT_FILE_NOTEBOOK_EDITOR_PANEL,
	[WORKBENCH_COMPONENTS.PROJECT_FILE_PDF_EDITOR]:
		PROJECT_FILE_PDF_EDITOR_PANEL,
};

/**
 * Read-only notebook workbench used by the notebook view page and the share
 * page. Shows `main.ipynb` and the published `/public` files without the
 * terminal, assistant, or settings surfaces of the editable workbench.
 */
export const NotebookViewWorkbench: React.FC = () => {
	return (
		<Workbench
			layout={NOTEBOOK_VIEW_WORKBENCH_LAYOUT}
			components={NOTEBOOK_VIEW_WORKBENCH_COMPONENTS}
			readOnly
		/>
	);
};
