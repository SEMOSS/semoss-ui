import { HammerIcon, PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { download, useInsight } from "@semoss/sdk/react";
import { FileExplorer, FileExplorerItem, FlexLayout } from "@semoss/shared";
import { toast } from "@semoss/ui/next";
import { MCP } from "@/constants";

interface EngineFileExplorerProps {
	/** Node */
	layout: FlexLayout.Layout | null;

	/** Node */
	node: FlexLayout.TabNode;

	/** Engine */
	engine: string;
}

export const EngineFileExplorer: React.FC<EngineFileExplorerProps> = observer(
	({ layout, node, engine }) => {
		const insight = useInsight();
		const [searchParams, setSearchParams] = useSearchParams();

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

		useEffect(() => {
			const mcpParam = searchParams.get("mcp");
			const mcpFilePath = "/mcp/pixel_mcp.json";
			if (mcpParam === "Generate") {
				addNode(`ENGINE_MCP_EDITOR--${mcpFilePath}`, {
					type: "tab",
					name: `Toolbox Editor - pixel_mcp.json`,
					component: "engine-mcp-editor",
					config: {
						name: "pixel_mcp.json",
						path: mcpFilePath,
					},
					enableClose: true,
				});
				toast.success("MCP generated");
			}
			searchParams.delete("mcp");
			setSearchParams(searchParams);
		}, [searchParams]);

		return (
			<FileExplorer
				mode={{
					type: "ENGINE",
					engine: engine,
				}}
				onItemSelect={(item) => {
					// don't open directories
					if (item.type === "directory") {
						return;
					}

					// this will select if there or open if not
					addNode(`ENGINE_FILE--${item.path}`, {
						type: "tab",
						name: item.name,
						component: "engine-file-editor",
						config: {
							name: item.name,
							path: item.path,
						},
						enableClose: true,
					});
				}}
				ItemComponent={({ item, refresh, ...otherProps }) => {
					const isDriverFile =
						item.type !== "directory" &&
						MCP.DRIVER_PATHS.some((f) => item.path === f);
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
										component: "engine-file-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
									},
								);
							}}
							{...otherProps}
							actions={[
								isDriverFile
									? {
											name: "Create",
											icon: <HammerIcon />,
											tooltip: "Create Toolbox",
											action: async () => {
												try {
													await insight.actions.run(
														`MakePythonMCP(engine=["${engine}"]);`,
													);

													// refresh the explorer
													refresh();

													// open the editor for the created file
													addNode(
														`ENGINE_MCP_EDITOR--/mcp/py_mcp.json`,
														{
															type: "tab",
															name: `Toolbox Editor - py_mcp.json`,
															component:
																"engine-mcp-editor",
															config: {
																name: "py_mcp.json",
																path: "/mcp/py_mcp.json",
															},
															enableClose: true,
														},
													);
												} catch (e) {
													toast.error(`Error: ${e}`);
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
												// this will select if there or open if not
												addNode(
													`ENGINE_MCP_EDITOR--${item.path}`,
													{
														type: "tab",
														name: `Toolbox Editor - ${item.name}`,
														component:
															"engine-mcp-editor",
														config: {
															name: item.name,
															path: item.path,
														},
														enableClose: true,
													},
												);
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
														`DownloadEngineAsset(engine=["${engine}"], filePath=["${item.path}"]);`,
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
												const pixel = `UnzipFile(filePath=["${item.path}"], space=["${engine}"])`;

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
											`DeleteEngineAssets(engine=["${engine}"], filePath=["${item.path}"]);`,
										);

										refresh();
									},
								},
							]}
						/>
					);
				}}
			/>
		);
	},
);
