import { FolderTreeIcon } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { InsightProvider } from "@semoss/sdk/react";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import { EngineFileEditor } from "@/components/workbench/engine/engine-file-editor-panel";
import { EngineFileExplorer } from "@/components/workbench/engine/engine-file-explorer-panel";
import { EngineMcpEditor } from "@/components/workbench/engine/engine-mcp-editor-panel";
import { Workbench } from "@/components/workbench/workbench";

export const EngineStorageViewerPage = () => {
	const { engineId } = useParams<{ engineId: string }>();

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
							id: "ENGINE_STORAGE_VIEWER_EXPLORER",
							name: "Storage Viewer",
							component: "engine-file-explorer",
							config: {
								explorerMode: "STORAGE",
							},
							helpText: "Storage Viewer",
							enableClose: false,
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
		"engine-file-explorer": {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return (
					<EngineFileExplorer
						layout={layout}
						node={node}
						engine={engineId || ""}
					/>
				);
			},
		},
		"engine-file-editor": {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineFileEditor node={node} engine={engineId || ""} />;
			},
		},
		"engine-mcp-editor": {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <EngineMcpEditor node={node} engine={engineId || ""} />;
			},
		},
	};

	return (
		<div className="h-[calc(100vh-200px)] w-full overflow-hidden">
			<InsightProvider>
				<Workbench model={model} components={components} />
			</InsightProvider>
		</div>
	);
};
