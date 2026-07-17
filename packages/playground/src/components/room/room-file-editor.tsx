import { observer } from "mobx-react-lite";
import {
	buildExecutePixel,
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
			const getNextExecutionCount = (notebook: {
				cells: Array<{ cell_type: string; execution_count?: unknown }>;
			}): number => {
				let maxCount = 0;
				for (const notebookCell of notebook.cells) {
					if (
						notebookCell.cell_type === "code" &&
						typeof notebookCell.execution_count === "number" &&
						Number.isFinite(notebookCell.execution_count)
					) {
						maxCount = Math.max(
							maxCount,
							notebookCell.execution_count,
						);
					}
				}

				return maxCount + 1;
			};

			return (
				<IpynbViewer
					insightId={room.insightId}
					path={config.path}
					initialTab={config.initialTab}
					onRowSelectionChange={(selection) => {
						room.setSelectedNotebookRow(selection);
					}}
					onRunCell={async (request: RunIpynbCellRequest) => {
						const source = Array.isArray(request.cell.source)
							? request.cell.source.join("")
							: request.cell.source;
						const language = String(
							request.cell.metadata?.language ??
								request.notebook.metadata?.language_info
									?.name ??
								"python",
						).toLowerCase();
						const executePixel = buildExecutePixel(
							language,
							source,
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
							if (logs.length > 0) {
								outputList.push({
									output_type: "stream",
									name: "stdout",
									text: logs.join("\n"),
								});
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
									executionCount: getNextExecutionCount(
										request.notebook,
									),
								};
							}

							const last = results.at(-1);
							const opType = last?.operationType?.[0] ?? "";
							const value = unwrapPixelOutput(last ?? {});
							const isError =
								opType === "ERROR" ||
								opType === "INVALID_SYNTAX";
							outputList.push(
								...runtimeOutputToJupyterOutputs(value, {
									isError,
								}),
							);

							return {
								outputs: outputList,
								executionCount: getNextExecutionCount(
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
