import {
	DatabaseIcon,
	FolderTreeIcon,
	NetworkIcon,
	SettingsIcon,
	Table2Icon,
} from "lucide-react";
import { useEffect } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { useDatabaseWorkbench, useEngine, useWorkbench } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
	EngineSettingsToggle,
} from "../engine";
import { Workbench } from "../workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.constants";
import { DatabaseColumnsPanel } from "./database-columns-panel";
import { DatabaseNewQueryButton } from "./database-new-query-button";
import { DatabaseQueryPanel } from "./database-query-panel";
import { DatabaseQueryResultsPanel } from "./database-query-results-panel";

/** FlexLayout tabset that hosts both file editors and query editors */
const MAIN_TABSET = "MAIN_TABSET";

const DATABASE_WORKBENCH_LAYOUT: FlexLayout.IJsonModel = {
	global: {
		tabSetEnableDeleteWhenEmpty: true,
		tabEnableRename: false,
	},
	borders: [
		{
			type: "border",
			location: "left",
			size: 300,
			selected: 0,
			children: [
				{
					type: "tab",
					id: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
					name: "Columns",
					component: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
					helpText: "Database Structure",
					enableClose: false,
				},
				{
					type: "tab",
					id: WORKBENCH_COMPONENTS.FILE_EXPLORER,
					name: "Files",
					component: WORKBENCH_COMPONENTS.FILE_EXPLORER,
					config: {},
					helpText: "File Explorer",
					enableClose: false,
				},
			],
		},
		{
			type: "border",
			location: "bottom",
			size: 300,
			selected: -1,
			children: [],
		},
	],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				id: MAIN_TABSET,
				weight: 100,
				enableDeleteWhenEmpty: false,
				children: [
					{
						type: "tab",
						id: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						name: "Query",
						component: WORKBENCH_COMPONENTS.DATABASE_QUERY,
						enableClose: false,
						enableRename: true,
					},
				],
			},
		],
	},
};

/**
 * Database workbench that combines the file editor with an inline SQL/SPARQL
 * query experience. The query language is derived from the database category
 * (RDF -> SPARQL, otherwise SQL). Rendered inside an InsightProvider so the
 * category/structure pixels and query execution share a single insight.
 */
export const DatabaseWorkbench: React.FC = () => {
	const registerCommand = useWorkbench((state) => state.registerCommand);
	const { engine } = useEngine();

	// Structure, results, and query execution are lifted into the workbench's
	// `database` slice so they can be shared across the columns/query/results panels.
	const initialize = useDatabaseWorkbench((state) => state.initialize);
	const addQueryPanel = useDatabaseWorkbench((state) => state.addQueryPanel);

	// initialize the workbench
	useEffect(() => {
		initialize(engine.engine_id);
	}, [engine.engine_id, initialize]);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <EngineFileExplorerPanel layout={layout} node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.FILE_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineFileEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.MCP_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineMcpEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.DATABASE_COLUMNS]: {
			tab: () => <NetworkIcon className="size-4" />,
			view: () => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseColumnsPanel />
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.DATABASE_QUERY]: {
			tab: () => <DatabaseIcon className="size-4" />,
			view: (node: FlexLayout.TabNode) => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseQueryPanel node={node} />
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.DATABASE_RESULTS]: {
			tab: () => <Table2Icon className="size-4" />,
			view: (node: FlexLayout.TabNode) => {
				return (
					<div className="h-full w-full overflow-hidden">
						<DatabaseQueryResultsPanel node={node} />
					</div>
				);
			},
		},
		[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: {
			tab: () => <SettingsIcon className="size-4" />,
			view: () => (
				<EngineSettingsPanel
					tabs={[
						{
							name: "Overview",
							component: "overview",
							restrict: [
								"READ_ONLY",
								"EDIT",
								"OWNER",
								"DISCOVERABLE",
							],
						},
						{
							name: "Usage",
							component: "usage",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "MCP",
							component: "mcp-usage",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "Activity Log",
							component: "activity",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "Metadata",
							component: "metadata",
							restrict: ["READ_ONLY", "EDIT", "OWNER"],
						},
						{
							name: "Access Control",
							component: "access-control",
							restrict: ["EDIT", "OWNER"],
						},
						{
							name: "SMSS",
							component: "smss",
							restrict: ["OWNER"],
						},
					]}
				/>
			),
		},
	};

	useEffect(() => {
		return registerCommand([
			{
				id: "workbench.file-explorer.open",
				label: "Open File Explorer",
				icon: <FolderTreeIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.FILE_EXPLORER, {
						type: "tab",
						name: "Files",
						component: WORKBENCH_COMPONENTS.FILE_EXPLORER,
						helpText: "File Explorer",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.settings.open",
				label: "Open Settings",
				icon: <SettingsIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.ENGINE_SETTINGS, {
						type: "tab",
						name: "Settings",
						component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
						helpText: "Settings",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.database-columns.open",
				label: "Open Columns",
				icon: <NetworkIcon />,
				handler: (get) => {
					get().openPanel(WORKBENCH_COMPONENTS.DATABASE_COLUMNS, {
						type: "tab",
						name: "Columns",
						component: WORKBENCH_COMPONENTS.DATABASE_COLUMNS,
						helpText: "Database Columns",
						enableClose: false,
					});
				},
			},
			{
				id: "workbench.database-query.open",
				label: "New Query",
				icon: <DatabaseIcon />,
				handler: () => {
					addQueryPanel("");
				},
			},
		]);
	}, [registerCommand, addQueryPanel]);

	return (
		<Workbench
			layout={DATABASE_WORKBENCH_LAYOUT}
			components={components}
			actions={
				<div className="flex flex-col gap-1">
					<DatabaseNewQueryButton />
					<EngineSettingsToggle />
				</div>
			}
		/>
	);
};
