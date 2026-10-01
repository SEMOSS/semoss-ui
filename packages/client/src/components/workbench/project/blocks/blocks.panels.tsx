import {
	Blocks,
	Braces,
	Layers,
	Notebook,
	NotebookTabs,
	PanelsTopLeft,
	Share2,
	SlidersHorizontal,
} from "lucide-react";
import type { WorkbenchPanelConfig } from "@semoss/workbench";
import { useWorkbenchPanel } from "@semoss/workbench";
import { DEFAULT_MENU } from "@/components/blocks-workspace/menus/default-menu";
import {
	BlocksMenuPanel,
	DesignerPanel,
	ExportButtonPanel,
	LayersPanel,
	NotebookExplorerPanel,
	NotebookViewerPanel,
	SelectedBlockPanel,
	VariablesPanel,
} from "@/components/blocks-workspace/panels";

/**
 * Dock blueprints for the BLOCKS panels.
 *
 * Adapters, not panels: the panels themselves live in
 * `components/blocks-workspace/panels/` and know nothing about the dock. Each
 * one is a handful of lines, so they share a file rather than becoming eight
 * near-empty modules next to the eight real ones.
 *
 * None of them registers a chrome control. Their actions — the notebook's
 * create button, the variables panel's rename suggestions — are wired to state
 * inside the panel, and they sit in a row under the dock's header the same way
 * the file explorer's path bar does.
 */

/** What a panel showing one thing by id is opened with. */
export interface BlocksIdParams {
	id: string;
}

/** Two panels of the same type are the same panel when they name the same id. */
const matchesId = (a: { id?: string }, b: { id?: string }): boolean =>
	Boolean(a.id) && a.id === b.id;

const DesignerPanelContent = ({ id }: { id: string }) => {
	const { config } = useWorkbenchPanel<BlocksIdParams>(id);
	return <DesignerPanel id={config.id} />;
};

/** One page of the app, in the designer. */
export const BLOCKS_DESIGNER_PANEL: WorkbenchPanelConfig<BlocksIdParams> = {
	name: "Page",
	helpText: "Designer",
	mount: "keepAlive",
	canRename: false,
	matches: matchesId,
	icon: ({ className }) => <PanelsTopLeft className={className} />,
	content: DesignerPanelContent,
};

const NotebookViewerPanelContent = ({ id }: { id: string }) => {
	const { config } = useWorkbenchPanel<BlocksIdParams>(id);
	return <NotebookViewerPanel id={config.id} />;
};

/** One of the app's notebooks. */
export const BLOCKS_NOTEBOOK_VIEWER_PANEL: WorkbenchPanelConfig<BlocksIdParams> =
	{
		name: "Notebook",
		helpText: "Notebook",
		mount: "keepAlive",
		canRename: false,
		matches: matchesId,
		icon: ({ className }) => <NotebookTabs className={className} />,
		content: NotebookViewerPanelContent,
	};

/** The palette of blocks that can be dragged onto a page. */
export const BLOCKS_MENU_PANEL: WorkbenchPanelConfig = {
	name: "Blocks",
	helpText: "Blocks",
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	icon: ({ className }) => <Blocks className={className} />,
	content: () => <BlocksMenuPanel items={DEFAULT_MENU} name="blocks" />,
};

/** The page's block tree. */
export const BLOCKS_LAYERS_PANEL: WorkbenchPanelConfig = {
	name: "Layers",
	helpText: "Layers",
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	icon: ({ className }) => <Layers className={className} />,
	content: () => <LayersPanel />,
};

/** The app's variables. */
export const BLOCKS_VARIABLES_PANEL: WorkbenchPanelConfig = {
	name: "Variables",
	helpText: "Variables",
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	icon: ({ className }) => <Braces className={className} />,
	content: () => <VariablesPanel />,
};

/** The app's notebooks. */
export const BLOCKS_NOTEBOOK_EXPLORER_PANEL: WorkbenchPanelConfig = {
	name: "Notebooks",
	helpText: "Notebooks",
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	icon: ({ className }) => <Notebook className={className} />,
	content: () => <NotebookExplorerPanel />,
};

/** Settings for whatever block is selected in the designer. */
export const BLOCKS_SELECTED_PANEL: WorkbenchPanelConfig = {
	name: "Block Settings",
	helpText: "Block Settings",
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	icon: ({ className }) => <SlidersHorizontal className={className} />,
	content: () => <SelectedBlockPanel />,
};

/** Builds an export button against one of the app's frames. */
export const BLOCKS_EXPORT_PANEL: WorkbenchPanelConfig = {
	name: "Export",
	helpText: "Export Tool",
	canClose: false,
	canRename: false,
	canDrag: false,
	mount: "keepAlive",
	icon: ({ className }) => <Share2 className={className} />,
	content: () => <ExportButtonPanel />,
};
