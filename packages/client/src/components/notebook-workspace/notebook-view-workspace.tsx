import { observer } from "mobx-react-lite";
import { AppFileEditor } from "@/components/app-workspace/app-file-editor";
import { AppFileExplorer } from "@/components/app-workspace/app-file-explorer";
import { useProject } from "@/hooks";
import type { WorkspaceOptions } from "../../stores";
import { WorkspaceManager } from "../workspace";

const NOTEBOOK_MAIN_TAB_ID = "MAIN_IPYNB";

const PUBLIC_ROOT_PATH = "/public";

const DEFAULT_OPTIONS: WorkspaceOptions = {
	version: "",
	layout: {
		global: {
			tabEnableClose: false,
			tabEnableRename: false,
		},
		borders: [
			{
				type: "border",
				location: "left",
				selected: 0,
				size: 400,
				children: [
					{
						id: "file-explorer",
						type: "tab",
						name: "Files",
						component: "app-file-explorer",
						enableClose: false,
						config: {},
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
					id: "main-tabset",
					weight: 100,
					selected: 0,
					enableMaximize: true,
					children: [
						{
							id: NOTEBOOK_MAIN_TAB_ID,
							type: "tab",
							name: "main.ipynb",
							component: "app-file-editor",
							config: {
								name: "main.ipynb",
								path: "/public/main.ipynb",
							},
							enableClose: true,
						},
					],
				},
			],
		},
	},
};

export const NotebookViewWorkspace: React.FC = observer(() => {
	const { project } = useProject();

	const FACTORY: React.ComponentProps<typeof WorkspaceManager>["factory"] = (
		node,
		layout,
	) => {
		const component = node.getComponent();

		if (component === "app-file-explorer") {
			return (
				<AppFileExplorer
					node={node}
					layout={layout}
					app={project.project_id}
					initialPath={PUBLIC_ROOT_PATH}
					readOnly
				/>
			);
		} else if (component === "app-file-editor") {
			return (
				<AppFileEditor node={node} app={project.project_id} readOnly />
			);
		}

		return <>{component}</>;
	};

	return (
		<WorkspaceManager
			readOnly
			options={DEFAULT_OPTIONS}
			factory={FACTORY}
		/>
	);
});
