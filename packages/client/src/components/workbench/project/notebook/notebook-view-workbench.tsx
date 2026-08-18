import { FolderTreeIcon } from "lucide-react";
import { useMemo } from "react";
import { type FlexLayout, getFileIconComponent } from "@semoss/shared";
import { WORKBENCH_COMPONENTS, Workbench } from "@/components/workbench";
import type { WorkbenchPanelConfig } from "@/stores/workbench";
import { ProjectFileEditorPanel, ProjectFileExplorerPanel } from "..";

/** FlexLayout tabset that hosts the notebook and any other opened files. */
const MAIN_TABSET = "MAIN_TABSET";

/** Notebook every project of type NOTEBOOK is created with. */
const NOTEBOOK_PATH = "/public/main.ipynb";
const NOTEBOOK_NAME = "main.ipynb";

/** Only published assets are browsable from the read-only surface. */
const PUBLIC_ROOT_PATH = "/public";

/**
 * Read-only notebook workbench used by the notebook view page and the share
 * page. Shows `main.ipynb` and the published `/public` files without the
 * terminal, chat, or settings surfaces of the editable workbench.
 */
export const NotebookViewWorkbench: React.FC = () => {
	const layout = useMemo<FlexLayout.IJsonModel>(() => {
		return {
			global: {
				tabSetEnableDeleteWhenEmpty: true,
				tabEnableRename: false,
			},
			borders: [
				{
					type: "border",
					location: "left",
					size: 400,
					selected: 0,
					children: [
						{
							type: "tab",
							id: WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
							name: "Files",
							component:
								WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER,
							config: {},
							helpText: "File Explorer",
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
						id: MAIN_TABSET,
						weight: 100,
						enableDeleteWhenEmpty: false,
						children: [
							{
								id: `${WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR}--${NOTEBOOK_PATH}`,
								type: "tab",
								name: NOTEBOOK_NAME,
								component:
									WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR,
								config: {
									name: NOTEBOOK_NAME,
									path: NOTEBOOK_PATH,
								},
								enableClose: true,
							},
						],
					},
				],
			},
		};
	}, []);

	const components: Record<string, WorkbenchPanelConfig> = {
		[WORKBENCH_COMPONENTS.PROJECT_FILE_EXPLORER]: {
			tab: () => <FolderTreeIcon className="size-4" />,
			view: (node: FlexLayout.TabNode, layout: FlexLayout.Layout) => {
				return (
					<ProjectFileExplorerPanel
						layout={layout}
						node={node}
						initialPath={PUBLIC_ROOT_PATH}
						readOnly
					/>
				);
			},
		},
		[WORKBENCH_COMPONENTS.PROJECT_FILE_EDITOR]: {
			tab: (node: FlexLayout.TabNode) => {
				const Icon = getFileIconComponent(node.getName());
				return <Icon className="size-4" />;
			},
			view: (node: FlexLayout.TabNode) => {
				return <ProjectFileEditorPanel node={node} readOnly />;
			},
		},
	};

	return <Workbench layout={layout} components={components} readOnly />;
};
