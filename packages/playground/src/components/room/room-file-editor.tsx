import { observer } from "mobx-react-lite";
import {
	mapNotebookConsoleResultToOutputs,
	NotebookViewer,
	prepareNotebookCellExecution,
	type RunNotebookCellRequest,
	runtimeOutputToJupyterOutputs,
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
		const isNotebookFile = config.path.toLowerCase().endsWith(".ipynb");

		if (isNotebookFile) {
			return (
				<NotebookViewer
					insightId={room.insightId}
					path={config.path}
					initialTab={config.initialTab}
					onRowSelectionChange={(selection) => {
						room.setSelectedNotebookRow(selection);
					}}
					onRunCell={async (request: RunNotebookCellRequest) => {
						// Notebook cells are executed through Pixel, then mapped back
						// into Jupyter-style outputs for .ipynb compatibility. All of
						// the notebook-specific preparation/mapping logic lives in
						// @semoss/notebook; this callback is just the thin bridge to
						// the Playground-specific Pixel console runner.
						const { language, executePixel } =
							prepareNotebookCellExecution(request);

						if (!executePixel) {
							return {
								outputs: runtimeOutputToJupyterOutputs(
									`Execution is not supported for ${language} cells in Playground.`,
									{ isError: true },
								),
							};
						}

						try {
							const consoleResult =
								await room.runRoomPixelWithConsole(
									executePixel,
								);

							return mapNotebookConsoleResultToOutputs(
								consoleResult,
								request.notebook,
							);
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
