import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import {
	Blocks,
	DefaultBlocks,
	DefaultCells,
	MigrationManager,
	type SerializedState,
	STATE_VERSION,
	StateStore,
} from "@semoss/renderer";
import { runPixel, useInsight } from "@semoss/sdk/react";
import { Spinner, toast, useCacheData } from "@semoss/ui/next";
import type {
	WorkbenchLayout,
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import {
	useWorkbench,
	useWorkbenchCommands,
	Workbench,
	WorkbenchCommandMenuButton,
	WorkbenchResetButton,
} from "@semoss/workbench";
import { BlocksWorkspaceDev } from "@/components/blocks-workspace/BlocksWorkspaceDev";
import { BlocksWorkspaceActions } from "@/components/blocks-workspace/blocks-workspace-actions";
import { ProjectNavbar } from "@/components/project/project-navbar";
import { WorkspaceLoading } from "@/components/workspace/WorkspaceLoading";
import { DesignerContext } from "@/contexts";
import { useProject, useWorkspace } from "@/hooks";
import { DesignerStore } from "@/stores";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench";
import {
	createOpenPanelCommand,
	createReconnectCommand,
} from "../../workbench.presets";
import { ProjectPublishButton } from "../project-publish-button";
import {
	createProjectSettingsPanel,
	ProjectSettingsToggle,
} from "../project-settings-toggle";
import { PROJECT_TERMINAL_PANEL } from "../project-terminal-panel";
import {
	BLOCKS_DESIGNER_PANEL,
	BLOCKS_EXPORT_PANEL,
	BLOCKS_LAYERS_PANEL,
	BLOCKS_MENU_PANEL,
	BLOCKS_NOTEBOOK_EXPLORER_PANEL,
	BLOCKS_NOTEBOOK_VIEWER_PANEL,
	BLOCKS_SELECTED_PANEL,
	BLOCKS_VARIABLES_PANEL,
	type BlocksIdParams,
} from "./blocks.panels";

/** The page every BLOCKS app is created with, and its seeded designer tab. */
const ACTIVE_PAGE = "page-1";
const DESIGNER_PANEL_ID = `${WORKBENCH_COMPONENTS.BLOCKS_DESIGNER}--${ACTIVE_PAGE}`;

const DEFAULT_BORDER_SIZE = 300;
/** What the right border opens to. Narrower is allowed; see its record. */
const BLOCK_SETTINGS_WIDTH = 450;

/**
 * The default arrangement: the page under edit front and centre, the block
 * palette and the app's other contents open on the left, and the right and
 * bottom rails collapsed until something is asked of them.
 */
const createBlocksWorkbenchLayout = (projectId: string): WorkbenchLayout => ({
	tree: {
		type: "tabset",
		id: "main",
		size: 1,
		panelIds: [DESIGNER_PANEL_ID],
		activeId: DESIGNER_PANEL_ID,
	},
	panels: {
		[DESIGNER_PANEL_ID]: {
			id: DESIGNER_PANEL_ID,
			type: WORKBENCH_COMPONENTS.BLOCKS_DESIGNER,
			name: ACTIVE_PAGE,
			canClose: true,
			config: { id: ACTIVE_PAGE },
		},
		[WORKBENCH_PANEL_RECORDS.BLOCKS_MENU.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_MENU,
		[WORKBENCH_PANEL_RECORDS.BLOCKS_LAYERS.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_LAYERS,
		[WORKBENCH_PANEL_RECORDS.BLOCKS_VARIABLES.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_VARIABLES,
		[WORKBENCH_PANEL_RECORDS.BLOCKS_NOTEBOOK_EXPLORER.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_NOTEBOOK_EXPLORER,
		[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]: {
			...WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
			config: { mode: { type: "APP", app: projectId } },
		},
		[WORKBENCH_PANEL_RECORDS.BLOCKS_SELECTED.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_SELECTED,
		[WORKBENCH_PANEL_RECORDS.BLOCKS_EXPORT.id]:
			WORKBENCH_PANEL_RECORDS.BLOCKS_EXPORT,
		[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
			WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
	},
	borders: {
		left: {
			panelIds: [
				WORKBENCH_COMPONENTS.BLOCKS_MENU,
				WORKBENCH_COMPONENTS.BLOCKS_LAYERS,
				WORKBENCH_COMPONENTS.BLOCKS_VARIABLES,
				WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_EXPLORER,
				WORKBENCH_COMPONENTS.FILE_EXPLORER,
			],
			activeId: WORKBENCH_COMPONENTS.BLOCKS_MENU,
			size: DEFAULT_BORDER_SIZE,
		},
		// Collapsed to a bare rail. Both panels here are answers to "now change
		// this one thing", so neither earns the width until it is asked for;
		// clicking either rail tab opens it, and clicking it again puts it
		// away.
		right: {
			panelIds: [
				WORKBENCH_COMPONENTS.BLOCKS_SELECTED,
				WORKBENCH_COMPONENTS.BLOCKS_EXPORT,
			],
			activeId: null,
			size: BLOCK_SETTINGS_WIDTH,
		},
		bottom: {
			panelIds: [WORKBENCH_COMPONENTS.PROJECT_TERMINAL],
			activeId: null,
			size: DEFAULT_BORDER_SIZE,
		},
	},
});

/** Blueprints, keyed by type. Module-scope so identities never churn. */
export const BLOCKS_WORKBENCH_COMPONENTS: Record<
	string,
	WorkbenchPanelConfigAny
> = {
	[WORKBENCH_COMPONENTS.BLOCKS_DESIGNER]: BLOCKS_DESIGNER_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_MENU]: BLOCKS_MENU_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_LAYERS]: BLOCKS_LAYERS_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_VARIABLES]: BLOCKS_VARIABLES_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_EXPLORER]:
		BLOCKS_NOTEBOOK_EXPLORER_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_VIEWER]: BLOCKS_NOTEBOOK_VIEWER_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_SELECTED]: BLOCKS_SELECTED_PANEL,
	[WORKBENCH_COMPONENTS.BLOCKS_EXPORT]: BLOCKS_EXPORT_PANEL,
	...FILE_PANEL_COMPONENTS,
	[WORKBENCH_COMPONENTS.PROJECT_TERMINAL]: PROJECT_TERMINAL_PANEL,
	// The shared `PROJECT_SETTINGS_TABS` plus Settings, which BLOCKS shows and
	// the shared list does not. Written out rather than spliced: the insert
	// sits in the middle, so a splice would read as an index into a list
	// defined in another file.
	[WORKBENCH_COMPONENTS.PROJECT_SETTINGS]: createProjectSettingsPanel([
		{ name: "Overview", component: "project-overview" },
		{
			name: "MCP",
			component: "mcp-usage",
			restrict: ["OWNER", "EDIT", "READ_ONLY"],
		},
		{ name: "GitHub", component: "github", restrict: ["OWNER"] },
		{ name: "Settings", component: "settings", restrict: ["OWNER"] },
		{
			name: "Access Control",
			component: "access-control",
			restrict: ["OWNER", "EDIT"],
		},
		{ name: "SMSS", component: "smss", restrict: ["OWNER"] },
	]),
};

/**
 * Keep the designer pointed at whichever page tab is in front.
 *
 * Inside the dock rather than beside it: the selection lives in the workbench
 * store, so this subscribes to it. The FlexLayout shell had to wrap
 * `model.doAction` to find out, which meant every action in the app paid for
 * one panel's bookkeeping.
 *
 * @param designer - The store to point, once the app's state has loaded.
 */
const useSelectedPage = (designer: DesignerStore | undefined): void => {
	const pageId = useWorkbench((s) => {
		const pid = s.layout.selection.panel;
		const record = pid ? s.layout.panels[pid] : undefined;
		return record?.type === WORKBENCH_COMPONENTS.BLOCKS_DESIGNER
			? (record.config as Partial<BlocksIdParams> | undefined)?.id
			: undefined;
	});

	useEffect(() => {
		if (designer && pageId) {
			designer.setSelected(pageId);
		}
	}, [designer, pageId]);
};

/**
 * Open a page from outside the dock.
 *
 * The renderer's blocks dispatch an `OPEN_EVENT` when a listener action names
 * an "App Page" destination, and they have no handle on the workbench.
 */
const useOpenPageEvent = (): void => {
	const layoutActions = useWorkbench((s) => s.layout.actions);

	useEffect(() => {
		const handler = (event: Event) => {
			const { destinationType, destination } = (event as CustomEvent)
				.detail;
			if (destinationType !== "App Page" || !destination) {
				return;
			}

			layoutActions.selectPanel(
				WORKBENCH_COMPONENTS.BLOCKS_DESIGNER,
				{ id: destination },
				{ name: destination },
			);
		};

		window.addEventListener("OPEN_EVENT", handler);
		return () => window.removeEventListener("OPEN_EVENT", handler);
	}, [layoutActions]);
};

/**
 * The dock, mounted once the app's state has loaded.
 *
 * Deliberately not an `observer`: it reads no MobX state, and wrapping it made
 * a component that writes to the designer store in its own effect also
 * subscribe to that store.
 */
const BlocksWorkbenchDock = ({
	designer,
}: {
	designer: DesignerStore | undefined;
}) => {
	const { project } = useProject();
	const insight = useInsight();

	const workbenchLayout = useMemo(
		() => createBlocksWorkbenchLayout(project.project_id),
		[project.project_id],
	);

	const [snapshot, onSnapshotChange] = useCacheData<WorkbenchSnapshot>(
		`workbench-layout--${project.project_id}--1`,
		workbenchLayout,
	);

	useSelectedPage(designer);
	useOpenPageEvent();

	useWorkbenchCommands([
		createReconnectCommand(insight),
		createOpenPanelCommand({
			id: "workbench.blocks-menu.open",
			label: "Open Blocks",
			type: WORKBENCH_COMPONENTS.BLOCKS_MENU,
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-layers.open",
			label: "Open Layers",
			type: WORKBENCH_COMPONENTS.BLOCKS_LAYERS,
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-variables.open",
			label: "Open Variables",
			type: WORKBENCH_COMPONENTS.BLOCKS_VARIABLES,
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-notebooks.open",
			label: "Open Notebooks",
			type: WORKBENCH_COMPONENTS.BLOCKS_NOTEBOOK_EXPLORER,
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: { mode: { type: "APP", app: project.project_id } },
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-settings.open",
			label: "Open Block Settings",
			type: WORKBENCH_COMPONENTS.BLOCKS_SELECTED,
		}),
		createOpenPanelCommand({
			id: "workbench.blocks-export.open",
			label: "Open Export Tool",
			type: WORKBENCH_COMPONENTS.BLOCKS_EXPORT,
		}),
		createOpenPanelCommand({
			id: "workbench.project-terminal.open",
			label: "Open Terminal",
			type: WORKBENCH_COMPONENTS.PROJECT_TERMINAL,
		}),
		createOpenPanelCommand({
			id: "workbench.project-settings.open",
			label: "Open Settings",
			type: WORKBENCH_COMPONENTS.PROJECT_SETTINGS,
		}),
	]);

	return (
		<Workbench
			snapshot={snapshot}
			onChange={onSnapshotChange}
			borderSlots={{
				left: {
					after: (
						<>
							<WorkbenchCommandMenuButton />
							<ProjectPublishButton />
							<ProjectSettingsToggle />
							<WorkbenchResetButton snapshot={workbenchLayout} />
						</>
					),
				},
			}}
		/>
	);
};

/**
 * Blocks workbench — the editable surface for a BLOCKS project.
 *
 * Loads the app's serialized state, migrates it if it predates the current
 * `STATE_VERSION`, and hands it to the renderer; everything below that is the
 * dock, the same one the CODE, NOTEBOOK, SKILL and AGENT workbenches mount.
 */
export const BlocksWorkbench: React.FC = observer(() => {
	const { workspace } = useWorkspace();
	const { project } = useProject();
	const [state, setState] = useState<StateStore>();

	// A reload loses whatever is in the designer, which is not saved until the
	// user saves it.
	useEffect(() => {
		if (import.meta.env.DEV) {
			return;
		}

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: loads once, for the project this workspace was mounted for
	useEffect(() => {
		workspace.setLoading(true);

		runPixel<[SerializedState]>(
			`GetAppBlocksJson ( project=["${project.project_id}"]);`,
			workspace.insightId ? workspace.insightId : "new",
		)
			.then(async ({ pixelReturn, errors, insightId }) => {
				if (errors.length) {
					throw new Error(errors.join(""));
				}

				const { output } = pixelReturn[0];
				let loaded = output;

				if (loaded.version !== STATE_VERSION) {
					loaded = await new MigrationManager().run(output);
				}

				setState(
					new StateStore({
						mode: "static",
						insightId: insightId,
						state: loaded,
						cellRegistry: DefaultCells,
					}),
				);
			})
			.catch((e) => {
				toast.error(e.message);
				console.error(e);
			})
			.finally(() => {
				workspace.setLoading(false);
			});
	}, []);

	const designer = useMemo(
		() =>
			state
				? new DesignerStore(state, { rendered: ACTIVE_PAGE })
				: undefined,
		[state],
	);

	if (!state) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// The navbar, the loading screen and the dev dialog all render through
	// portals, so they are siblings of the dock rather than wrappers around it
	// — the dock fills the page area on its own.
	return (
		<Blocks state={state} registry={DefaultBlocks}>
			<DesignerContext.Provider value={{ designer: designer }}>
				<ProjectNavbar actions={<BlocksWorkspaceActions />} />
				<WorkspaceLoading />
				<BlocksWorkbenchDock designer={designer} />
				<BlocksWorkspaceDev />
			</DesignerContext.Provider>
		</Blocks>
	);
});
