import type {
	WorkbenchComponent,
	WorkbenchLayout,
	WorkbenchPanelConfig,
	WorkbenchPanelConfigAny,
} from "@/stores/workbench";
import { Workbench } from "../../core";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "../../workbench.constants";
import {
	PROJECT_FILE_EDITOR_PANEL,
	type ProjectFileEditorConfig,
	ProjectFileEditorPanel,
} from "../project-file-editor-panel";
import { PROJECT_FILE_EXPLORER_PANEL } from "../project-file-explorer-panel";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** Only published assets are browsable from the read-only surface. */
const PUBLIC_ROOT_PATH = "/public";

/** Forces every editor instance in this workbench into view-only mode. */
const ViewProjectFileEditor: WorkbenchComponent<ProjectFileEditorConfig> = (
	props,
) => (
	<ProjectFileEditorPanel
		{...props}
		config={{ ...props.config, readOnly: true }}
	/>
);

/** The editor blueprint with view-only content, same dedupe and icon. */
const VIEW_PROJECT_FILE_EDITOR_PANEL: WorkbenchPanelConfig<ProjectFileEditorConfig> =
	{
		...PROJECT_FILE_EDITOR_PANEL,
		content: ViewProjectFileEditor,
	};

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
			type: WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
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
	[WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR]: VIEW_PROJECT_FILE_EDITOR_PANEL,
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
