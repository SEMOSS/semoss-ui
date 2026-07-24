import { observer } from "mobx-react-lite";
import {
	buildExecutePixel,
	buildNotebookExecutionSource,
	extractNotebookInlineDisplayOutputsFromLogs,
	getNextNotebookExecutionCount,
	IpynbViewer,
	type JupyterCellOutput,
	type RunIpynbCellRequest,
	runtimeOutputToJupyterOutputs,
	unwrapPixelOutput,
} from "@semoss/notebook";
import { FileEditor, FlexLayout } from "@semoss/shared";
import type { RoomStore } from "@/stores";

interface RoomFileEditorProps {
	/** Node */
	node: FlexLayout.TabNode;

	/** Room */
	room: RoomStore;
}

export const RoomFileEditor: React.FC<RoomFileEditorProps> = observer(
	({ node, room }) => {
		const config: {
			name: string;
			path: string;
			initialTab?: "edit" | "preview";
		} = node.getConfig();
		const isIpynb = config.path.toLowerCase().endsWith(".ipynb");

		if (isIpynb) {
			return (
				<IpynbViewer
					insightId={room.insightId}
					path={config.path}
					initialTab={config.initialTab}
					onRowSelectionChange={(selection) => {
						room.setSelectedNotebookRow(selection);
					}}
					onRunCell={async (request: RunIpynbCellRequest) => {
						// Notebook cells are executed through Pixel, then mapped back
						// into Jupyter-style outputs for .ipynb compatibility.
						const source = Array.isArray(request.cell.source)
							? request.cell.source.join("")
							: request.cell.source;
						const language = String(
							request.cell.metadata?.language ??
								request.notebook.metadata?.language_info
									?.name ??
								"python",
						).toLowerCase();
						const sourceForExecution = buildNotebookExecutionSource(
							language,
							source,
						);
						// Unsupported languages still return a notebook error output so
						// execution state remains visible inside the cell.
						const executePixel = buildExecutePixel(
							language,
							sourceForExecution,
						);

						if (!executePixel) {
							return {
								outputs: runtimeOutputToJupyterOutputs(
									`Execution is not supported for ${language} cells in Playground.`,
									{ isError: true },
								),
							};
						}

						try {
							const { errors, results, logs } =
								await room.runRoomPixelWithConsole(
									executePixel,
								);

							const outputList: JupyterCellOutput[] = [];
							const { cleanedLogs, displayOutputs } =
								extractNotebookInlineDisplayOutputsFromLogs(
									logs,
								);

							if (cleanedLogs.length > 0) {
								outputList.push({
									output_type: "stream",
									name: "stdout",
									text: cleanedLogs.join("\n"),
								});
							}

							if (displayOutputs.length > 0) {
								outputList.push(...displayOutputs);
							}

							if (errors.length > 0) {
								return {
									outputs: [
										...outputList,
										...runtimeOutputToJupyterOutputs(
											errors.join("\n"),
											{ isError: true },
										),
									],
									executionCount:
										getNextNotebookExecutionCount(
											request.notebook,
										),
								};
							}

							for (const result of results) {
								// Pixel can emit multiple operation frames; keep each frame
								// as a separate notebook output in execution order.
								const operationTypes =
									result.operationType ?? [];
								const isError =
									operationTypes.includes("ERROR") ||
									operationTypes.includes("INVALID_SYNTAX");
								const value = unwrapPixelOutput(result ?? {});

								if (value === undefined || value === null) {
									continue;
								}

								if (
									typeof value === "string" &&
									value.trim().length === 0
								) {
									continue;
								}

								outputList.push(
									...runtimeOutputToJupyterOutputs(value, {
										isError,
										operationType: operationTypes,
									}),
								);
							}

							if (outputList.length === 0) {
								outputList.push(
									...runtimeOutputToJupyterOutputs(
										"Success (no output)",
									),
								);
							}

							return {
								outputs: outputList,
								executionCount: getNextNotebookExecutionCount(
									request.notebook,
								),
							};
						} catch (error) {
							return {
								outputs: runtimeOutputToJupyterOutputs(
									error instanceof Error
										? error.message
										: "Execution failed",
									{ isError: true },
								),
							};
						}
					}}
				/>
			);
		}

		return (
			<FileEditor
				mode={{
					type: "INSIGHT",
				}}
				path={config.path}
				onChange={(_content, isModified) => {
					const updated = isModified
						? `${config.name}*`
						: config.name;

					// rename the tab
					room.sidebar.model.doAction(
						FlexLayout.Actions.renameTab(node.getId(), updated),
					);
				}}
			/>
		);
	},
);
