import { PencilIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import { FileExplorer, FileExplorerItem, FlexLayout } from "@semoss/shared";
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

		return (
			<FileExplorer
				mode={{
					type: "ENGINE",
					engine: engine,
				}}
				ItemComponent={({ item, onSelect, ...otherProps }) => {
					return (
						<FileExplorerItem
							draggable={true}
							item={item}
							onSelect={() => {
								// trigger the default
								onSelect();

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
							actions={[
								MCP.JSON_PATHS.some((f) =>
									item.path.startsWith(f),
								) && item.type !== "directory"
									? {
											name: "Edit",
											icon: <PencilIcon />,
											tooltip: "Edit Tool",
											action: async (item) => {
												// this will select if there or open if not
												addNode(
													`ENGINE_MCP_EDITOR--${item.path}`,
													{
														type: "tab",
														name: `MCP Editor - ${item.name}`,
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
								// item.path.endsWith(".zip")
								// 	? {
								// 			name: "Unzip",
								// 			action: async () => {
								// 				const pixel = "";

								// 				await insight.actions.run(
								// 					pixel,
								// 				);
								// 			},
								// 		}
								// 	: null,
								{
									name: "Delete",
									action: async (item) => {
										const pixel = `DeleteEngineAssets(engine=["${engine}"], filePath=["${item.path}"]);`;

										await insight.actions.run(pixel);
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
