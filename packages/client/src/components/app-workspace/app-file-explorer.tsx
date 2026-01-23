import { CloudUploadIcon, HammerIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { download, useInsight } from "@semoss/sdk/react";
import { FileExplorer, FileExplorerItem, FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MCP } from "@/constants";

interface AppFileExplorerProps {
	/** Node */
	layout: FlexLayout.Layout | null;

	/** Node */
	node: FlexLayout.TabNode;

	/** App */
	app: string;
}

export const AppFileExplorer: React.FC<AppFileExplorerProps> = observer(
	({ layout, node, app }) => {
		const insight = useInsight();

		/**
		 * Add a node to the layout
		 * @param nodeId
		 * @param options
		 * @returns
		 */
		const addNode = (
			nodeId: string,
			options: {
				[key: string]: unknown;
			},
		) => {
			const model = node.getModel();

			// select the node if there
			const selectedNode = model.getNodeById(nodeId);
			if (selectedNode) {
				model.doAction(
					FlexLayout.Actions.selectTab(selectedNode.getId()),
				);
				return;
			}

			// create the node if it is not there
			// where to add the node
			const addId =
				model.getActiveTabset()?.getId() ||
				model.getRoot().getChildren()[0]?.getId() ||
				"";

			// create and select the panel
			model.doAction(
				FlexLayout.Actions.addNode(
					{
						...options,
						id: nodeId,
					},
					addId,
					FlexLayout.DockLocation.CENTER,
					-1,
					true,
				),
			);
		};

		/**
		 * Add the editor tab
		 */
		const addMCPEditorTab = async (itemPath: string) => {
			const name = `Tool Editor ${`- ${itemPath.split("/").pop()}` || ""}`;

			// add the editor
			const { pixelReturn } = await insight.actions.run<[string]>(
				`GetAppAssets(filePath=["${itemPath}"], project=["${app}"]);`,
			);

			let json = {};
			try {
				json = JSON.parse(pixelReturn[0].output);
			} catch (e) {
				console.error(`Failed to parse MCP JSON: ${e}`);
			}

			addNode(`APP_MCP_EDITOR--${itemPath}`, {
				type: "tab",
				name: name,
				component: "mcpJsonEditor",
				config: {
					data: {
						initialData: json,
						onSave: async (data, path) => {
							try {
								await insight.actions.run(
									`SaveAppAssets(project=["${app}"], filePath=["${path}"], content=["<encode>${JSON.stringify(data, null, 2)}</encode>"]);`,
								);
								toast.success("Tool saved successfully");
							} catch (e) {
								toast.error(`Failed to save Tool: ${e}`);
								return;
							}
						},
						name: name,
						path: itemPath,
					},
				},
				enableClose: true,
			});
		};

		return (
			<FileExplorer
				mode={{
					type: "APP",
					app: app,
				}}
				headerActions={
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={async () => {
									try {
										// Seperate calls so we reload successfully compiled classes before publishing
										await insight.actions.run(
											`ReloadInsightClasses(project='${app}', release=false);`,
										);

										await insight.actions.run(
											`PublishProject(project='${app}', release=true);`,
										);
									} catch (e) {
										toast.error(`Error: ${e}`);
									}
								}}
							>
								<CloudUploadIcon className="size-3" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							Compile and publish the app
						</TooltipContent>
					</Tooltip>
				}
				onItemSelect={(item) => {
					// don't open directories
					if (item.type === "directory") {
						return;
					}

					// this will select if there or open if not
					addNode(`ENGINE_FILE--${item.path}`, {
						type: "tab",
						name: item.name,
						component: "app-file-editor",
						config: {
							name: item.name,
							path: item.path,
						},
						enableClose: true,
					});
				}}
				ItemComponent={({ item, refresh, ...otherProps }) => {
					return (
						<FileExplorerItem
							draggable={item.type !== "directory"}
							item={item}
							refresh={refresh}
							onDragStart={(e) => {
								// cannot drag directories
								if (item.type === "directory") {
									return;
								}

								// add to layout
								layout.addTabWithDragAndDrop(
									e as unknown as DragEvent,
									{
										type: "tab",
										name: item.name,
										component: "app-file-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
									},
								);
							}}
							actions={[
								MCP.DRIVER_PATHS.some((f) =>
									item.path.startsWith(f),
								) && item.type !== "directory"
									? {
											name: "Create",
											icon: <HammerIcon />,
											tooltip: "Create Toolbox",
											action: async () => {
												try {
													await insight.actions.run(
														`MakePythonMCP(project=["${app}"]);`,
													);

													// refresh the explorer
													refresh();

													// add it
													addMCPEditorTab(
														"/mcp/py_mcp.json",
													);
												} catch (e) {
													toast.error(e.message);
													console.error(e);
												}
											},
										}
									: null,
								MCP.JSON_PATHS.some((f) =>
									item.path.startsWith(f),
								) && item.type !== "directory"
									? {
											name: "Edit",
											icon: <PencilIcon />,
											tooltip: "Edit Toolbox",
											action: async (item) => {
												addMCPEditorTab(item.path);
											},
										}
									: null,
							]}
							secondaryActions={[
								{
									name: "Copy Path",
									action: async (item) => {
										try {
											await navigator.clipboard.writeText(
												item.path,
											);
										} catch (_e) {
											throw new Error(
												"Failed to copy to clipboard",
											);
										}
									},
								},
								item.type !== "directory"
									? {
											name: "Download",
											action: async (item) => {
												// save it
												const { pixelReturn } =
													await insight.actions.run<
														[string]
													>(
														`DownloadAppAsset(project=["${app}"], filePath=["${item.path}"]);`,
													);

												// get the file key
												const fileKey =
													pixelReturn[0].output;

												// download the file
												await download(
													insight.insightId,
													fileKey,
												);

												refresh();
											},
										}
									: null,
								item.path.endsWith(".zip")
									? {
											name: "Unzip",
											action: async () => {
												const pixel = `UnzipFile(filePath=["${item.path}"], space=["${app}"])`;

												await insight.actions.run(
													pixel,
												);

												refresh();
											},
										}
									: null,
								{
									name: "Delete",
									action: async (item) => {
										await insight.actions.run(
											`DeleteAppAssets(project=["${app}"], filePath=["${item.path}"]);`,
										);

										refresh();
									},
								},
							]}
							{...otherProps}
						/>
					);
				}}
			/>
		);
	},
);
