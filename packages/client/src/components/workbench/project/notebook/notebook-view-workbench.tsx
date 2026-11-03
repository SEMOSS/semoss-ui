import { useMemo } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import { useCacheData } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import { useWorkbenchCommands, Workbench } from "@semoss/workbench";
import { useProject } from "@/hooks";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import {
	createNewTerminalCommand,
	createOpenPanelCommand,
} from "../../workbench.presets";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** The seeded main.ipynb editor tab. Dedupe happens on `config.path`. */
const NOTEBOOK_EDITOR_ID = "notebook-main";

/** Only published assets are browsable from the read-only surface. */
const PUBLIC_ROOT_PATH = "/public";

/**
 * The default arrangement: main.ipynb open, the /public files on the left, and
 * on the view page the terminal below. The share page shows only the notebook
 * and its files.
 */
const createNotebookViewWorkbenchLayout = (
	projectId: string,
	variant: NotebookViewWorkbenchProps["variant"],
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
		...(variant === "view"
			? {
					[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
						WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
				}
			: {}),
	},
	borders: {
		left: {
			panelIds: [WORKBENCH_COMPONENTS.FILE_EXPLORER],
			activeId: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			size: 400,
		},
		...(variant === "view"
			? {
					bottom: {
						panelIds: [WORKBENCH_COMPONENTS.PROJECT_TERMINAL],
						activeId: null,
						size: 300,
					},
				}
			: {}),
	},
});

/**
 * Blueprints, keyed by type. Module-scope so identities never churn. Both
 * variants share them; only the view variant seeds the terminal.
 */
export const NOTEBOOK_VIEW_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
};

export interface NotebookViewWorkbenchProps {
	/**
	 * Which mount this is. The notebook's own view page and the share page
	 * render the same dock and keep separate arrangements, and nothing inside
	 * the shell tells them apart.
	 */
	variant: "view" | "share";
}

/**
 * The version at the end of each variant's cache name. Each moves on its own,
 * when its default arrangement changes.
 */
const LAYOUT_VERSIONS = {
	view: 2,
	share: 1,
} as const satisfies Record<NotebookViewWorkbenchProps["variant"], number>;

/**
 * Read-only notebook workbench used by the notebook view page and the share
 * page. Shows `main.ipynb` and the published `/public` files without the
 * assistant or settings surfaces of the editable workbench; the view page
 * also has a Pixel terminal.
 */
export const NotebookViewWorkbench: React.FC<NotebookViewWorkbenchProps> = ({
	variant,
}) => {
	const { project } = useProject();
	const workbenchLayout = useMemo(
		() => createNotebookViewWorkbenchLayout(project.project_id, variant),
		[project.project_id, variant],
	);

	// This shell is mounted by two pages — the notebook's own view and the
	// share page — and they keep separate arrangements, so the variant is a
	// prop rather than something the shell can work out for itself.
	const [snapshot, onSnapshotChange] = useCacheData<WorkbenchSnapshot>(
		`workbench-layout--${project.project_id}-${variant}--${LAYOUT_VERSIONS[variant]}`,
		workbenchLayout,
	);

	// the share page has no terminal, so nothing to open
	useWorkbenchCommands(
		variant === "view"
			? [
					createOpenPanelCommand({
						id: "workbench.project-terminal.open",
						label: "Open Terminal",
						type: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
					}),
					createNewTerminalCommand(
						WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
					),
				]
			: [],
	);

	return <Workbench snapshot={snapshot} onChange={onSnapshotChange} />;
};
