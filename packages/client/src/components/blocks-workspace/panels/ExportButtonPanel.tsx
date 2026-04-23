import { RefreshCw, X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import type { BlockJSON, ListenerActions } from "@semoss/renderer";
import {
	ActionMessages,
	useBlocks,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import { Badge, Button, Input, Switch, toast } from "@semoss/ui/next";
import { Panel } from "@/components/workspace";
import { useDesigner } from "@/hooks";

export interface GridBlockColumn {
	name: string;
	width?: string;
	selector: string;
}

export const ExportButtonPanel = observer(() => {
	const frameSelectId = useId();
	const { designer } = useDesigner();
	const { state } = useBlocks();

	const [selectedFrame, setSelectedFrame] = useState<string>("");
	const [selectedColumns, setSelectedColumns] = useState<GridBlockColumn[]>(
		[],
	);
	const [downloadType, setDownloadType] = useState<
		"csv" | "tsv" | "text" | "excel"
	>("csv");
	const [delimiter, setDelimiter] = useState<string>("");
	const [buttonLabel, setButtonLabel] = useState<string>("Export Data");
	const [isLoading, setIsLoading] = useState(false);
	const [exportMode, setExportMode] = useState<"button" | "direct">("button");
	const [previousFrame, setPreviousFrame] = useState<string>("");
	const [hasInitializedFrame, setHasInitializedFrame] = useState(false);

	// Fetch available frames using useBlocksPixel
	const getFrames = useBlocksPixel<string[]>("GetFrames();", {
		data: [],
	});
	const availableFrameNames =
		getFrames.status === "SUCCESS" ? getFrames.data : [];

	// Get frame headers for the selected frame
	const frameHeaders = useFrameHeaders(selectedFrame);

	// Compute columns from frame headers
	const frameColumns = useMemo(() => {
		return frameHeaders.data.list.map((item) => {
			return {
				name: item.alias,
				selector: item.header,
				width: undefined,
			};
		});
	}, [frameHeaders]);

	// When user selects a NEW frame, mark that we need to initialize columns
	useEffect(() => {
		if (selectedFrame !== previousFrame) {
			setPreviousFrame(selectedFrame);
			setHasInitializedFrame(false); // Mark that we need to initialize
		}
	}, [selectedFrame, previousFrame]);

	// Once frameColumns are loaded for a new frame, populate selectedColumns once per frame
	useEffect(() => {
		if (selectedFrame && frameColumns.length > 0 && !hasInitializedFrame) {
			// Only set once when columns first load for this frame
			setSelectedColumns([...frameColumns]);
			setHasInitializedFrame(true);
		}
		if (!selectedFrame) {
			setSelectedColumns([]);
		}
	}, [frameColumns, selectedFrame, hasInitializedFrame]);

	/**
	 * Refresh the available frames list
	 */
	const handleRefreshFrames = () => {
		getFrames.refresh();
		toast.success("Frames refreshed");
	};

	/**
	 * Remove a column from the selected columns list
	 */
	const handleRemoveColumn = (columnNameToRemove: string) => {
		const updatedColumns = selectedColumns.filter(
			(col) => col.name !== columnNameToRemove,
		);
		setSelectedColumns(updatedColumns);
	};

	/**
	 * Reset selection to include all available columns
	 */
	const handleReset = () => {
		if (frameColumns.length > 0) {
			setSelectedColumns([...frameColumns]);
		}
	};

	/**
	 * Find an existing notebook with matching pixel statement
	 */
	const findMatchingNotebook = (
		targetPixelStatement: string,
	): string | null => {
		const allQueries = state.queries; // Get all queries/notebooks

		for (const queryId in allQueries) {
			const queryData = allQueries[queryId];
			// Check if the notebook has cells
			if (queryData.cells) {
				// Get all cell IDs from the cells object
				const cellIds = Object.keys(queryData.cells);
				if (cellIds.length > 0) {
					// Get the first cell
					const firstCellId = cellIds[0];
					const firstCell = queryData.cells[firstCellId];
					if (
						firstCell &&
						firstCell.parameters?.type === "pixel" &&
						firstCell.parameters?.code === targetPixelStatement
					) {
						return queryId;
					}
				}
			}
		}

		return null;
	};

	/**
	 * Create an export button and place it in the layer
	 */
	const handleCreateExportButton = async () => {
		try {
			setIsLoading(true);

			// Validate delimiter for text format
			if (downloadType === "text" && !delimiter.trim()) {
				toast.warning(
					"Delimiter is not defined. Please enter a delimiter for the file.",
				);
				return;
			}

			// Validate that we have the required data
			if (!selectedFrame || selectedColumns.length === 0) {
				toast.error("Please select a frame and at least one column");
				return;
			}

			// Build the pixel statement
			const columnNames = selectedColumns
				.map((col) => col.name)
				.join(",");

			let conversionFunction = "ToCsv()";
			if (downloadType === "csv") {
				conversionFunction = "ToCsv()";
			} else if (downloadType === "tsv") {
				conversionFunction = "ToTsv()";
			} else if (downloadType === "text") {
				conversionFunction = `ToTxt(delimiter=["${delimiter}"])`;
			} else if (downloadType === "excel") {
				conversionFunction = "ToExcel()";
			}

			const pixelStatement = `Frame(frame=[${selectedFrame}])|Select(${columnNames})|${conversionFunction}`;

			// Check if a notebook with this exact pixel statement already exists
			let finalNotebookName = findMatchingNotebook(pixelStatement);
			let isNewNotebook = true;

			// If no matching notebook exists, create a new one
			if (!finalNotebookName) {
				const notebookName = `export_${selectedFrame}_${downloadType}`;

				// Find a unique name for the new notebook
				finalNotebookName = notebookName;
				let count = 1;
				while (state.getQuery(finalNotebookName)) {
					finalNotebookName = `${notebookName} (${count})`;
					count++;
				}

				// Create a new code cell with the pixel statement
				await state.dispatch({
					message: ActionMessages.NEW_QUERY,
					payload: {
						queryId: finalNotebookName,
						config: {
							cells: [
								{
									id: "1",
									widget: "code",
									parameters: {
										type: "pixel",
										code: pixelStatement,
									},
								},
							],
						},
					},
				});
			} else {
				isNewNotebook = false;
			}

			// Determine the parent for placement
			// If a block is selected, use its parent; otherwise use the root page
			let parentId = "page-1"; // default to main page
			let parentSlot = "content";

			if (designer.selected) {
				const selectedBlock = state.getBlock(designer.selected);
				if (selectedBlock?.parent) {
					parentId = selectedBlock.parent.id;
					parentSlot = selectedBlock.parent.slot || "content";
				}
			}

			// Create a listener action that runs the export query when the button is clicked
			const runQueryAction: ListenerActions = {
				message: ActionMessages.RUN_QUERY,
				payload: {
					queryId: finalNotebookName,
				},
			};

			if (exportMode === "direct") {
				// Direct export mode: just run the query immediately
				await state.dispatch({
					message: ActionMessages.RUN_QUERY,
					payload: {
						queryId: finalNotebookName,
					},
				});

				toast.success(
					isNewNotebook
						? `Exporting data from ${selectedFrame}...`
						: `Exporting data from existing query...`,
				);
			} else {
				// Button mode: create a button block that triggers the export
				// Create the button block JSON structure
				const buttonBlockJSON: BlockJSON = {
					widget: "button",
					data: {
						style: {},
						label: buttonLabel,
						variant: "contained",
						color: "primary",
						show: "true",
						type: "button",
					},
					listeners: {
						onClick: {
							type: "sync",
							order: [runQueryAction],
						},
						preProcess: {
							type: "sync",
							order: [],
						},
					},
					slots: {},
				};

				// Add the button block to the selected layer
				await state.dispatch({
					message: ActionMessages.ADD_BLOCK,
					payload: {
						json: buttonBlockJSON,
						position: {
							parent: parentId,
							slot: parentSlot,
						},
					},
				});

				toast.success(
					isNewNotebook
						? `Export button "${buttonLabel}" created and added to layer`
						: `Export button "${buttonLabel}" created (using existing query)`,
				);
			}
		} catch (error) {
			console.error("Error creating export button:", error);
			toast.error("Failed to create export button");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Panel>
			<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
				<div>
					<h6 className="mb-4 font-semibold text-base">
						Export Data
					</h6>

					{/* Frame Selection */}
					<p className="mt-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.5px]">
						Frame
					</p>
					<div className="flex flex-col justify-center gap-2 py-1">
						<div className="flex flex-row items-center gap-2">
							<select
								id={`export-frame-select-${frameSelectId}`}
								disabled={getFrames.status !== "SUCCESS"}
								value={selectedFrame}
								onChange={(e) =>
									setSelectedFrame(e.target.value)
								}
								className="w-full flex-1 rounded border border-gray-300 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="">Select frame</option>
								{availableFrameNames.map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={handleRefreshFrames}
								title="Refresh frames"
							>
								<RefreshCw className="size-4" />
							</Button>
						</div>
					</div>

					{/* Column Selection */}
					{selectedFrame && (
						<>
							<p className="mt-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.5px]">
								Columns ({selectedColumns?.length || 0})
							</p>
							<div className="flex flex-col justify-center gap-2 py-1">
								<div className="flex max-h-[20vh] flex-wrap gap-2 overflow-y-auto pr-1">
									{selectedColumns?.map((col) => (
										<Badge
											key={col.name}
											variant="outline"
											className="flex items-center gap-1 text-xs"
										>
											{col.name}
											<button
												type="button"
												className="ml-1 hover:text-destructive"
												onClick={() =>
													handleRemoveColumn(col.name)
												}
											>
												<X className="size-3" />
											</button>
										</Badge>
									))}
									{!selectedColumns?.length && (
										<p className="text-muted-foreground text-sm">
											No columns selected
										</p>
									)}
								</div>
								<div className="flex flex-row justify-end gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={handleReset}
										disabled={
											selectedColumns.length ===
											frameColumns.length
										}
									>
										Reset
									</Button>
								</div>
							</div>
						</>
					)}

					{/* Download Type Selection */}
					{selectedFrame && (
						<div className="flex flex-col justify-center gap-2 py-1">
							<select
								value={downloadType}
								onChange={(e) =>
									setDownloadType(
										(e.target.value || "csv") as
											| "csv"
											| "tsv"
											| "text"
											| "excel",
									)
								}
								className="w-full rounded border border-gray-300 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<option value="csv">CSV</option>
								<option value="tsv">TSV</option>
								<option value="text">Text</option>
								<option value="excel">Excel</option>
							</select>

							{downloadType === "text" && (
								<div className="flex flex-col gap-1">
									<Input
										placeholder=","
										value={delimiter}
										onChange={(e) =>
											setDelimiter(e.target.value)
										}
										className="w-full"
									/>
									<p className="text-muted-foreground text-xs">
										Enter the delimiter (e.g., "," or "|")
									</p>
								</div>
							)}
						</div>
					)}

					{/* Export Mode Toggle */}
					{selectedFrame && (
						<div className="flex flex-col justify-center gap-2 py-1">
							<div className="flex flex-row items-center gap-2">
								<p className="mt-2 font-semibold text-muted-foreground text-xs uppercase tracking-[0.5px]">
									Direct Export
								</p>
								<Switch
									checked={exportMode === "direct"}
									onCheckedChange={(checked) =>
										setExportMode(
											checked ? "direct" : "button",
										)
									}
								/>
							</div>
						</div>
					)}

					{/* Button Label - Only show for button mode */}
					{selectedFrame && exportMode === "button" && (
						<div className="flex flex-col justify-center gap-2 py-1">
							<Input
								placeholder="Export Data"
								value={buttonLabel}
								onChange={(e) => setButtonLabel(e.target.value)}
								className="w-full"
							/>
						</div>
					)}

					{/* Create Button or Export Button - conditionally rendered */}
					{selectedFrame && (
						<div className="mt-2 flex flex-col justify-center gap-2 py-1">
							<Button
								onClick={handleCreateExportButton}
								disabled={
									selectedColumns.length === 0 ||
									isLoading ||
									(exportMode === "button" &&
										!buttonLabel.trim())
								}
								className="w-full"
							>
								{isLoading
									? "Processing..."
									: exportMode === "button"
										? "Create Export Button"
										: "Export Data"}
							</Button>
						</div>
					)}

					{availableFrameNames.length === 0 && (
						<div className="mt-4 rounded bg-yellow-50 p-4">
							<p className="text-sm text-yellow-700">
								No frames found. Create a frame or refresh
								frames to get started.
							</p>
						</div>
					)}
				</div>
			</div>
		</Panel>
	);
});
