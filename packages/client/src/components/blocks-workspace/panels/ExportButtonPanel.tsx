import { Sync } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import type { BlockJSON, ListenerActions } from "@semoss/renderer";
import {
	ActionMessages,
	useBlocks,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Autocomplete,
	Box,
	Button,
	Chip,
	IconButton,
	Stack,
	Switch,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { Panel } from "@/components/workspace";
import { useDesigner } from "@/hooks";

export interface GridBlockColumn {
	name: string;
	width?: string;
	selector: string;
}

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	padding: theme.spacing(2),
	height: "100%",
	overflowY: "auto",
}));

const StyledFieldWrapper = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	paddingTop: "5px",
	paddingBottom: "5px",
	gap: "8px",
}));

const StyledChipsContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexWrap: "wrap",
	gap: theme.spacing(1),
	maxHeight: "20vh",
	overflowY: "auto",
	paddingRight: theme.spacing(1),
	"&::-webkit-scrollbar": {
		width: "8px",
	},
	"&::-webkit-scrollbar-track": {
		background: "transparent",
	},
	"&::-webkit-scrollbar-thumb": {
		background: theme.palette.mode === "dark" ? "#555" : "#ccc",
		borderRadius: "4px",
	},
	"&::-webkit-scrollbar-thumb:hover": {
		background: theme.palette.mode === "dark" ? "#777" : "#aaa",
	},
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
	fontSize: "12px",
	fontWeight: 600,
	color: theme.palette.text.secondary,
	textTransform: "uppercase",
	letterSpacing: "0.5px",
	marginTop: theme.spacing(1),
}));

export const ExportButtonPanel = observer(() => {
	const frameSelectId = useId();
	const notification = useNotification();
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
		notification.add({
			color: "success",
			message: "Frames refreshed",
		});
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
				notification.add({
					color: "warning",
					message:
						"Delimiter is not defined. Please enter a delimiter for the file.",
				});
				return;
			}

			// Validate that we have the required data
			if (!selectedFrame || selectedColumns.length === 0) {
				notification.add({
					color: "error",
					message: "Please select a frame and at least one column",
				});
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

				notification.add({
					color: "success",
					message: isNewNotebook
						? `Exporting data from ${selectedFrame}...`
						: `Exporting data from existing query...`,
				});
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

				notification.add({
					color: "success",
					message: isNewNotebook
						? `Export button "${buttonLabel}" created and added to layer`
						: `Export button "${buttonLabel}" created (using existing query)`,
				});
			}
		} catch (error) {
			console.error("Error creating export button:", error);
			notification.add({
				color: "error",
				message: "Failed to create export button",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Panel>
			<StyledContainer>
				<div>
					<Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
						Export Data
					</Typography>
					{/* Frame Selection */}
					<StyledSectionTitle variant="body2">
						Frame
					</StyledSectionTitle>
					<StyledFieldWrapper>
						<Stack direction="row" spacing={1}>
							<Autocomplete
								fullWidth
								id={`export-frame-select-${frameSelectId}`}
								multiple={false}
								disabled={getFrames.status !== "SUCCESS"}
								value={selectedFrame}
								options={availableFrameNames}
								getOptionLabel={(option) => option}
								onChange={(_, value) => {
									setSelectedFrame(value || "");
								}}
								freeSolo={false}
								renderInput={(params) => (
									<TextField
										{...params}
										placeholder="Select frame"
										size="small"
										variant="outlined"
									/>
								)}
							/>
							<IconButton
								size="small"
								onClick={handleRefreshFrames}
								title="Refresh frames"
								sx={{ mt: 0.5 }}
							>
								<Sync fontSize="medium" />
							</IconButton>
						</Stack>
					</StyledFieldWrapper>
					{/* Column Selection */}
					{selectedFrame && (
						<>
							<StyledSectionTitle variant="body2">
								Columns ({selectedColumns?.length || 0})
							</StyledSectionTitle>
							<StyledFieldWrapper>
								<StyledChipsContainer>
									{selectedColumns?.map((col) => (
										<Chip
											key={col.name}
											label={col.name}
											size="small"
											variant="outlined"
											onDelete={() =>
												handleRemoveColumn(col.name)
											}
										/>
									))}
									{!selectedColumns?.length && (
										<Typography
											variant="body2"
											color="secondary"
										>
											No columns selected
										</Typography>
									)}
								</StyledChipsContainer>
								<Stack
									display="flex"
									flexDirection="row"
									gap={1}
									justifyContent="flex-end"
								>
									<Button
										size="small"
										color="primary"
										variant="outlined"
										onClick={handleReset}
										disabled={
											selectedColumns.length ===
											frameColumns.length
										}
									>
										Reset
									</Button>
								</Stack>
							</StyledFieldWrapper>
						</>
					)}
					{/* Download Type Selection */}
					{selectedFrame && (
						<StyledFieldWrapper>
							<Autocomplete
								fullWidth
								multiple={false}
								value={downloadType}
								options={["", "csv", "tsv", "text", "excel"]}
								onChange={(_, value) =>
									setDownloadType(
										(value || "csv") as
											| "csv"
											| "tsv"
											| "text"
											| "excel",
									)
								}
								getOptionLabel={(option) =>
									option === "csv"
										? "CSV"
										: option === "tsv"
											? "TSV"
											: option === "text"
												? "Text"
												: option === "excel"
													? "Excel"
													: ""
								}
								renderInput={(params) => (
									<TextField
										{...params}
										label="Download Type"
										size="small"
									/>
								)}
							/>

							{downloadType === "text" && (
								<TextField
									size="small"
									label="Delimiter"
									value={delimiter}
									onChange={(e) =>
										setDelimiter(e.target.value)
									}
									placeholder=","
									fullWidth
									helperText='Enter the delimiter (e.g., "," or "|")'
								/>
							)}
						</StyledFieldWrapper>
					)}
					{/* Export Mode Toggle */}
					{selectedFrame && (
						<StyledFieldWrapper>
							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
							>
								<StyledSectionTitle variant="body2">
									Direct Export
								</StyledSectionTitle>
								<Stack
									direction="row"
									alignItems="center"
									spacing={0.5}
								>
									<Switch
										size="small"
										checked={exportMode === "direct"}
										onChange={(
											e: React.ChangeEvent<HTMLInputElement>,
										) =>
											setExportMode(
												e.target.checked
													? "direct"
													: "button",
											)
										}
									/>
								</Stack>
							</Stack>
						</StyledFieldWrapper>
					)}
					{/* Button Label - Only show for button mode */}
					{selectedFrame && exportMode === "button" && (
						<StyledFieldWrapper>
							<TextField
								size="small"
								label="Button Label"
								value={buttonLabel}
								onChange={(e) => setButtonLabel(e.target.value)}
								placeholder="Export Data"
								fullWidth
							/>
						</StyledFieldWrapper>
					)}
					{/* Create Button or Export Button - conditionally rendered */}
					{selectedFrame && (
						<StyledFieldWrapper sx={{ mt: 2 }}>
							<Button
								size="medium"
								color="primary"
								variant="contained"
								onClick={handleCreateExportButton}
								disabled={
									selectedColumns.length === 0 ||
									isLoading ||
									(exportMode === "button" &&
										!buttonLabel.trim())
								}
								fullWidth
							>
								{isLoading
									? "Processing..."
									: exportMode === "button"
										? "Create Export Button"
										: "Export Data"}
							</Button>
						</StyledFieldWrapper>
					)}{" "}
					{availableFrameNames.length === 0 && (
						<Box
							sx={{
								mt: 2,
								p: 2,
								bgcolor: "warning.lighter",
								borderRadius: 1,
							}}
						>
							<Typography variant="body2" color="warning">
								No frames found. Create a frame or refresh
								frames to get started.
							</Typography>
						</Box>
					)}
				</div>
			</StyledContainer>
		</Panel>
	);
});
