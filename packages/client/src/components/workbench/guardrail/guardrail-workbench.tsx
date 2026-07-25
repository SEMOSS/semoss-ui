import { FolderTreeIcon, SettingsIcon } from "lucide-react";
import { useMemo } from "react";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import {
	EngineFileEditorPanel,
	EngineFileExplorerPanel,
	EngineMcpEditorPanel,
	EngineSettingsPanel,
} from "../engine";
import { Workbench } from "../workbench";
import { WORKBENCH_COMPONENTS } from "../workbench.contants";

/**
 * Guardrail workbench that exposes the engine's files through the shared file
 * explorer, editor, and MCP editor. Rendered inside an InsightProvider by the
 * page so its file operations share a single insight.
 */
export const GuardrailWorkbench: React.FC = () => {
	const model = useMemo(() => {
		return FlexLayout.Model.fromJson({
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
					size: 400,
					selected: -1,
					children: [
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
							name: "Settings",
							component: WORKBENCH_COMPONENTS.ENGINE_SETTINGS,
							config: {},
							helpText: "Settings",
							enableClose: false,
							borderWidth: 800,
							borderHeight: 1200,
						},
					],
				},
			],
			layout: {
				type: "row",
				weight: 100,
				children: [
					{
						type: "tabset",
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [],
					},
				],
			},
		});
	}, []);

	const components = {
		[WORKBENCH_COMPONENTS.FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			panel: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return <EngineFileExplorerPanel layout={layout} node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.FILE_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			panel: (node: FlexLayout.TabNode) => {
				return <EngineFileEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.MCP_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			panel: (node: FlexLayout.TabNode) => {
				return <EngineMcpEditorPanel node={node} />;
			},
		},
		[WORKBENCH_COMPONENTS.ENGINE_SETTINGS]: {
			tab: () => <SettingsIcon className="size-4" />,
			panel: () => (
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

	return <Workbench model={model} components={components} />;
};
