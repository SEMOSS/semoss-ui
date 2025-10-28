import { CreateOutlined, ExpandMore } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import {
	Box,
	Button,
	Collapse,
	Icon,
	IconButton,
	Stack,
	styled,
	Table,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";
import ColumnEditModal from "./ColumnEditModal";
import { CSV_UPLOAD_ICONS } from "./database.constants";

const StyledHeaderWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: theme.spacing(2),
}));

const StyledBodyWrapper = styled("div")(({ theme }) => ({
	backgroundColor: "#fff",
	border: "1px solid #C4C4C4",
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
	marginTop: 0,
	marginBottom: theme.spacing(4),
}));

const StyledTypography = styled(Typography)({
	color: "#212121",
	paddingLeft: "5px",
});

const StyledTableTypography = styled(Typography)({
	color: "#212121",
	fontSize: "14px",
});

const StyledSummaryHeader = styled(Stack)(({ theme }) => ({
	backgroundColor: "#f2f2f2",
	borderRadius: `${theme.shape.borderRadius}px 0px ${theme.shape.borderRadius}px 0px 0px`,
	flexDirection: "row",
	alignItems: "center",
	justifyContent: "space-between",
	padding: theme.spacing(2),
	cursor: "pointer",
}));

const StyledTypographyTitle = styled(Typography)({
	fontSize: "16px",
	color: "#212121",
});

const StyledExpandMoreIcon = styled(Icon)<{ collapse?: boolean }>(
	({ collapse }) => ({
		transform: collapse ? "rotate(180deg)" : "rotate(0deg)",
		transition: "transform 0.3s",
	}),
);

const StyledInnerBox = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: theme.spacing(2),
}));

const StyledSelectAllButton = styled(Button)({
	textTransform: "capitalize",
	fontSize: "14px",
	fontWeight: 600,
});

const StyledTableContainer = styled(Table.Container)({
	maxHeight: "400px",
	overflow: "auto",
});

const StyledBaseTableCell = styled(Table.Cell)(({ theme }) => ({
	borderBottom: 0,
	boxShadow: `0px -1px 0px 0px ${theme.palette.grey[300]} inset`,
}));

const StyledTableCell = styled(StyledBaseTableCell)(({ theme }) => ({
	padding: theme.spacing(1, 3, 1, 2),
}));

const StyedNameTextField = styled(TextField)({
	"& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": {
		borderStyle: "dotted",
	},
	"& .MuiInputBase-input": {
		color: "#666",
	},
});

const StyledFooterWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "space-between",
	marginTop: theme.spacing(2),
	gap: theme.spacing(2),
	marginBottom: theme.spacing(3),
}));

interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
}
interface ExcelDataSelectionProps {
	files: ParsedResult[];
	fileName: string[];
	onImport: (payload: Record<string, unknown>[]) => void;
	onCancel: () => void;
}

interface ColumnMetadata {
	alias?: string;
	dataType?: string;
	format?: string;
	description?: string;
	logicalName?: string[];
}

const ExcelDataSelection = ({
	files,
	fileName,
	onImport,
	onCancel,
}: ExcelDataSelectionProps) => {
	console.log("Files in ExcelDataSelection:", fileName);
	const [tableStates, setTableStates] = useState<
		Record<
			string,
			{
				rowEditableState: Record<number, boolean>;
				columnMetadata: Record<string, ColumnMetadata>;
				collapseAll: boolean;
				cleanHeaders?: string[];
				dataTypes?: Record<string, string>;
				tableName?: string;
			}
		>
	>({});

	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [selectedSheetKey, setSelectedSheetKey] = useState<string | null>(
		null,
	);
	const [editedRanges, setEditedRanges] = useState<Record<string, string>>(
		{},
	);

	const { monolithStore } = useRootStore();

	const handlePreviewRange = async (
		filePath: string,
		sheetKey: string,
		sheetName: string,
	) => {
		const range = editedRanges[sheetKey];
		if (!range) return;

		try {
			const pixelExpression = `META|PredictExcelRangeMetadata(filePath=["${filePath}"], sheetName=["${sheetName}"], sheetRange=["${range}"]);`;
			const response = await monolithStore.runQuery(pixelExpression);
			console.log("Preview Range Response:", response);

			const result: ParsedResult = response.pixelReturn[0].output;
			console.log("Preview Range Result:", result);

			if (!result?.cleanHeaders || !result?.dataTypes) {
				console.warn("Invalid result from API:", result);
				return;
			}

			const newColumnMetadata = Object.fromEntries(
				result.cleanHeaders.map((header: string) => [
					header,
					{
						alias: header,
						dataType: result.dataTypes?.[header] || "STRING",
						format: "",
						description: "",
						logicalName: [],
					},
				]),
			);

			const newRowEditableState = Object.fromEntries(
				result.cleanHeaders.map((_: string, index: number) => [
					index,
					true,
				]),
			);
			setTableStates((prev) => ({
				...prev,
				[sheetKey]: {
					rowEditableState: newRowEditableState,
					columnMetadata: newColumnMetadata,
					collapseAll: true,
					cleanHeaders: result.cleanHeaders,
					dataTypes: result.dataTypes,
				},
			}));
		} catch (err) {
			console.error("Error fetching range metadata:", err);
		}
	};

	// Setter for column metadata
	const setColumnMetadata = (
		updater: (
			prev: Record<string, ColumnMetadata>,
		) => Record<string, ColumnMetadata>,
	) => {
		if (!selectedSheetKey) return;
		setTableStates((prev) => ({
			...prev,
			[selectedSheetKey]: {
				...prev[selectedSheetKey],
				columnMetadata: updater(prev[selectedSheetKey].columnMetadata),
			},
		}));
	};

	useEffect(() => {
		const newTableStates: typeof tableStates = {};
		files.forEach((file, fileIndex) => {
			const sheetNames = Object.keys(file || {});
			sheetNames.forEach((sheetName) => {
				const range = Object.keys(file[sheetName])[0];
				const parsedData =
					tableStates[`${fileIndex}-${sheetName}`]?.cleanHeaders &&
					tableStates[`${fileIndex}-${sheetName}`]?.dataTypes
						? {
								cleanHeaders:
									tableStates[`${fileIndex}-${sheetName}`]
										.cleanHeaders!,
								dataTypes:
									tableStates[`${fileIndex}-${sheetName}`]
										.dataTypes!,
							}
						: file[sheetName][range];
				if (!parsedData) return;

				newTableStates[`${fileIndex}-${sheetName}`] = {
					rowEditableState: Object.fromEntries(
						parsedData.cleanHeaders.map((_, index) => [
							index,
							true,
						]),
					),
					columnMetadata: Object.fromEntries(
						parsedData.cleanHeaders.map((header) => [
							header,
							{
								alias: header,
								dataType:
									parsedData.dataTypes?.[header] || "String",
								format: "",
								description: "",
								logicalName: [],
							},
						]),
					),
					collapseAll: true,
					cleanHeaders: parsedData.cleanHeaders,
					dataTypes: parsedData.dataTypes || {},
					tableName: sheetName,
				};
			});
		});
		setTableStates(newTableStates);
	}, [files]);

	const toggleRowEditState = (sheetKey: string, index: number) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				rowEditableState: {
					...prev[sheetKey].rowEditableState,
					[index]: !prev[sheetKey].rowEditableState[index],
				},
			},
		}));
	};

	const handleOpenModal = (sheetKey: string, column: string) => {
		setSelectedSheetKey(sheetKey);
		setSelectedColumn(column);
		setOpenModal(true);
	};

	const handleNameChange = (
		sheetKey: string,
		column: string,
		newValue: string,
	) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				columnMetadata: {
					...prev[sheetKey].columnMetadata,
					[column]: {
						...prev[sheetKey].columnMetadata[column],
						alias: newValue,
					},
				},
			},
		}));
	};

	const handleTableNameChange = (sheetKey: string, newValue: string) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				tableName: newValue,
			},
		}));
	};

	const toggleCollapse = (sheetKey: string) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				collapseAll: !prev[sheetKey].collapseAll,
			},
		}));
	};

	const handleSelectAllToggle = (sheetKey: string) => {
		const areAllSelected = Object.values(
			tableStates[sheetKey].rowEditableState,
		).every((row) => row);
		const newState = Object.fromEntries(
			Object.keys(tableStates[sheetKey].rowEditableState).map((key) => [
				Number(key),
				!areAllSelected,
			]),
		);
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: { ...prev[sheetKey], rowEditableState: newState },
		}));
	};
	// Checks if range2 is smaller than range1
	function isSmallerRange(actualRange: string, typedRange: string): boolean {
		const parseRange = (range: string) => {
			const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(range);
			if (!match) return null;
			const [, startCol, startRow, endCol, endRow] = match;
			return {
				startCol: startCol.toUpperCase(),
				endCol: endCol.toUpperCase(),
				startRow: parseInt(startRow, 10),
				endRow: parseInt(endRow, 10),
			};
		};

		const actual = parseRange(actualRange);
		const typed = parseRange(typedRange);

		if (!actual || !typed) return false;

		// Convert column letters to numbers for comparison (A=1, B=2, ..., Z=26, AA=27)
		const colToNumber = (col: string) => {
			let num = 0;
			for (let i = 0; i < col.length; i++) {
				num = num * 26 + (col.charCodeAt(i) - 64); // A=65 ASCII
			}
			return num;
		};

		const actualStartColNum = colToNumber(actual.startCol);
		const actualEndColNum = colToNumber(actual.endCol);
		const typedStartColNum = colToNumber(typed.startCol);
		const typedEndColNum = colToNumber(typed.endCol);

		// Check for inverted range
		if (
			typedStartColNum > typedEndColNum ||
			typed.startRow > typed.endRow
		) {
			return false; // invalid inverted range
		}

		// Check if typed range is fully inside actual range
		const isInside =
			typedStartColNum >= actualStartColNum &&
			typedEndColNum <= actualEndColNum &&
			typed.startRow >= actual.startRow &&
			typed.endRow <= actual.endRow;

		return isInside;
	}

	const handleImport = () => {
	const payloadArray = files.map((file, fileIndex) => {
		const dataTypeMap: Record<
			string,
			Record<string, Record<string, string>>
		> = {};
		const newHeaders: Record<
			string,
			Record<string, Record<string, string>>
		> = {};
		const additionalDataTypes: Record<
			string,
			Record<string, Record<string, string>>
		> = {};
		const descriptionMap: Record<
			string,
			Record<string, Record<string, string>>
		> = {};
		const logicalNamesMap: Record<
			string,
			Record<string, Record<string, string[]>>
		> = {};

		const tables: Record<string, Record<string, string>> = {};

		const sheetNames = Object.keys(file || {});
		sheetNames.forEach((sheetName) => {
			const range = Object.keys(file[sheetName])[0];
			const sheetKey = `${fileIndex}-${sheetName}`;
			const parsedData = file[sheetName][range];
			const state = tableStates[sheetKey];
			if (!parsedData || !state) return;

			const editedRange = editedRanges[sheetKey] ?? range;
			const tableName = state.tableName?.trim() || sheetName;

			tables[sheetName] = { [editedRange]: tableName };

			dataTypeMap[sheetName] = { [editedRange]: {} };
			newHeaders[sheetName] = {};
			additionalDataTypes[sheetName] = { [editedRange]: {} };

			descriptionMap[sheetName] = { [editedRange]: {} };
			logicalNamesMap[sheetName] = { [editedRange]: {} };

			state.cleanHeaders?.forEach((header) => {
				const alias = state.columnMetadata[header]?.alias || header;

				dataTypeMap[sheetName][editedRange][alias] =
					state.columnMetadata[header]?.dataType || "STRING";

				if (alias !== header) {
					if (!newHeaders[sheetName][editedRange])
						newHeaders[sheetName][editedRange] = {};
					newHeaders[sheetName][editedRange][alias] = header;
				}

				if (state.columnMetadata[header]?.format) {
					additionalDataTypes[sheetName][editedRange][alias] =
						state.columnMetadata[header]?.format!;
				}

				if (state.columnMetadata[header]?.description) {
					descriptionMap[sheetName][editedRange][alias] =
						state.columnMetadata[header]?.description!;
				}

				if (
					Array.isArray(state.columnMetadata[header]?.logicalName) &&
					state.columnMetadata[header]!.logicalName!.length > 0
				) {
					logicalNamesMap[sheetName][editedRange][alias] =
						state.columnMetadata[header]!.logicalName!;
				}
			});
		});

		return {
			filePath: [fileName[fileIndex]],
			dataTypeMap,
			newHeaders,
			additionalDataTypes,
			descriptionMap: [descriptionMap],
			logicalNamesMap: [logicalNamesMap],
			tables: [tables],
			existing: fileIndex > 0 ? true : false,
		};
	});

	onImport(payloadArray);
};


	return (
		<>
			{files.map((file, fileIndex) => (
				<Box
					key={fileName[fileIndex]}
					data-testid={`excel-file-box-${fileIndex}`}
				>
					<StyledHeaderWrapper
						key={fileName[fileIndex]}
						data-testid={`excel-file-header-${fileIndex}`}
					>
						<Stack direction={"row"}>
							<img
								src={CSV_UPLOAD_ICONS.FILE_EXCEL}
								alt="Excel File"
								data-testid={"excel-file-icon"}
							/>
							<StyledTypography
								variant="h6"
								data-testid={`excel-file-name-${fileIndex}`}
							>
								{fileName[fileIndex]}
							</StyledTypography>
						</Stack>
					</StyledHeaderWrapper>

					{Object.keys(file || {}).map((sheetName) => {
						const range = Object.keys(file[sheetName])[0];
						const sheetKey = `${fileIndex}-${sheetName}`;
						const state = tableStates[sheetKey];

						// Use updated data from state if available, otherwise fallback to file
						const parsedData =
							state?.cleanHeaders && state?.dataTypes
								? {
										cleanHeaders: state.cleanHeaders,
										dataTypes: state.dataTypes,
									}
								: file[sheetName][range];

						if (!state || !parsedData) return null;

						return (
							<StyledBodyWrapper key={sheetKey}>
								<StyledSummaryHeader
									onClick={() => toggleCollapse(sheetKey)}
								>
									<StyledTypographyTitle
										variant="h6"
										data-testid={`excel-sheet-name-${sheetKey}`}
									>
										Sheet Name: {sheetName}
									</StyledTypographyTitle>
									<StyledExpandMoreIcon
										collapse={state.collapseAll}
									>
										<ExpandMore />
									</StyledExpandMoreIcon>
								</StyledSummaryHeader>

								<Collapse in={state.collapseAll}>
									<Box>
										<StyledInnerBox>
											<Stack
												direction="row"
												spacing={1}
												alignItems="center"
											>
												<StyledTypographyTitle variant="h6">
													Table Name:
												</StyledTypographyTitle>
												<TextField
													size="small"
													value={
														state.tableName ??
														sheetName
													}
													onChange={(e) =>
														handleTableNameChange(
															sheetKey,
															e.target.value,
														)
													}
													sx={{
														width: "220px",
														"& .MuiInputBase-input":
															{
																padding:
																	"4px 8px",
															},
													}}
												/>
											</Stack>

											<StyledSelectAllButton
												size="small"
												variant="text"
												color="primary"
												onClick={() =>
													handleSelectAllToggle(
														sheetKey,
													)
												}
											>
												{Object.values(
													state.rowEditableState,
												).every((v) => v)
													? "Unselect All"
													: "Select All"}
											</StyledSelectAllButton>
										</StyledInnerBox>

										<Stack
											spacing={2}
											padding={2}
											direction="row"
											alignItems="center"
										>
											<StyledTypographyTitle
												variant="h6"
												sx={{
													"&.MuiTypography-root": {
														marginBottom: "32px",
													},
												}}
											>
												Range:
											</StyledTypographyTitle>
											{/* Add your Range textfield + Preview button */}
											<Stack spacing={1}>
												<Stack
													direction="row"
													spacing={2}
													alignItems="flex-start"
													flexWrap="wrap"
												>
													{(() => {
														const currentValue =
															editedRanges[
																sheetKey
															] ?? range;

														const isValidFormat =
															/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.test(
																currentValue,
															);
														const isSameRange =
															currentValue.toUpperCase() ===
															range.toUpperCase();
														const showError =
															!isValidFormat ||
															(!isSmallerRange(
																range,
																currentValue,
															) &&
																!isSameRange);
														const errorText =
															!isValidFormat
																? "Invalid format. Use A1:H51 style."
																: isSameRange
																	? "Range must differ from the actual range."
																	: !isSmallerRange(
																				range,
																				currentValue,
																			)
																		? "Range must be smaller than the actual range."
																		: "";

														return (
															<Box
																sx={{
																	display:
																		"flex",
																	flexDirection:
																		"column",
																}}
															>
																<Box
																	sx={{
																		position:
																			"relative",
																		width: "250px",
																	}}
																>
																	<TextField
																		size="medium"
																		value={
																			currentValue
																		}
																		onChange={(
																			e,
																		) =>
																			setEditedRanges(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						e.target.value
																							.toUpperCase()
																							.replace(
																								/\s+/g,
																								"",
																							),
																				}),
																			)
																		}
																		placeholder="Enter range (e.g. A1:G20)"
																		sx={{
																			width: "100%",
																			border: showError
																				? "1px solid #d32f2f"
																				: undefined,
																			borderRadius: 1,
																			"& input":
																				{
																					height: "20px",
																					boxSizing:
																						"border-box",
																				},
																			"& fieldset":
																				{
																					border: showError
																						? "none"
																						: undefined,
																				},
																		}}
																	/>
																	{/* Reserve space for helper text */}
																	{/* Reserve space for helper text (multi-line supported) */}
																	<Box
																		sx={{
																			minHeight:
																				"30px",
																			mt: 0.3,
																			width: "100%",
																			overflow:
																				"hidden",
																		}}
																	>
																		{showError && (
																			<Typography
																				variant="body2"
																				sx={{
																					color: "#d32f2f",
																					fontSize:
																						"0.75rem",
																					lineHeight:
																						"1rem",
																					whiteSpace:
																						"normal",
																					wordBreak:
																						"break-word",
																				}}
																			>
																				{
																					errorText
																				}
																			</Typography>
																		)}
																	</Box>
																</Box>
															</Box>
														);
													})()}

													{(() => {
														const currentValue =
															editedRanges[
																sheetKey
															] ?? range;
														const isValidFormat =
															/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.test(
																currentValue,
															);
														const isSameRange =
															currentValue.toUpperCase() ===
															range.toUpperCase();
														const isValidRange =
															isValidFormat &&
															isSmallerRange(
																range,
																currentValue,
															) &&
															!isSameRange;

														return !isValidRange ? (
															<Tooltip
																title={
																	!isValidFormat
																		? "Invalid format (e.g. A1:H51)"
																		: isSameRange
																			? "Range must differ from the actual range"
																			: "Range must be smaller than the actual range"
																}
															>
																<span>
																	<Button
																		size="small"
																		variant="outlined"
																		color="primary"
																		disabled
																	>
																		Preview
																	</Button>
																</span>
															</Tooltip>
														) : (
															<Button
																size="small"
																variant="outlined"
																color="primary"
																onClick={() =>
																	handlePreviewRange(
																		fileName[
																			fileIndex
																		],
																		sheetKey,
																		sheetName,
																	)
																}
															>
																Preview
															</Button>
														);
													})()}

													<Typography
														variant="body2"
														sx={{
															color: "#757575",
															fontStyle: "italic",
															whiteSpace:
																"nowrap",
															"&.MuiTypography-root":
																{
																	marginTop:
																		"5px",
																},
														}}
													>
														Actual range: {range}
													</Typography>
												</Stack>
											</Stack>
										</Stack>

										<StyledTableContainer>
											<Table>
												<Table.Head>
													<Table.Row>
														<StyledTableCell
															sx={{
																width: "66%",
															}}
														>
															<StyledTableTypography variant="h6">
																Name
															</StyledTableTypography>
														</StyledTableCell>
														<StyledTableCell
															sx={{
																width: "20%",
															}}
														>
															<StyledTableTypography variant="h6">
																Data Type
															</StyledTableTypography>
														</StyledTableCell>
														<StyledTableCell
															sx={{ width: "7%" }}
														/>
														<StyledTableCell
															sx={{ width: "7%" }}
														/>
													</Table.Row>
												</Table.Head>

												<Table.Body>
													{state.cleanHeaders?.map(
														(column, index) => (
															<Table.Row
																key={column}
															>
																<StyledBaseTableCell
																	sx={{
																		width: "66%",
																	}}
																>
																	<StyedNameTextField
																		fullWidth
																		value={
																			state
																				.columnMetadata[
																				column
																			]
																				?.alias ??
																			column
																		}
																		onChange={(
																			e,
																		) =>
																			handleNameChange(
																				sheetKey,
																				column,
																				e
																					.target
																					.value,
																			)
																		}
																		variant="outlined"
																		size="small"
																		disabled={
																			!state
																				.rowEditableState[
																				index
																			]
																		}
																	/>
																</StyledBaseTableCell>

																<StyledBaseTableCell
																	sx={{
																		width: "20%",
																		pointerEvents:
																			!state
																				.rowEditableState[
																				index
																			]
																				? "none"
																				: "auto",
																	}}
																>
																	<Typography
																		variant="h6"
																		sx={{
																			fontSize:
																				"14px",
																			color: !state
																				.rowEditableState[
																				index
																			]
																				? "#9E9E9E"
																				: "#212121",
																		}}
																	>
																		{state
																			.columnMetadata[
																			column
																		]
																			?.dataType ||
																			"STRING"}
																	</Typography>
																</StyledBaseTableCell>

																<StyledBaseTableCell
																	sx={{
																		width: "7%",
																	}}
																>
																	<IconButton
																		size="small"
																		onClick={() =>
																			handleOpenModal(
																				sheetKey,
																				column,
																			)
																		}
																		disabled={
																			!state
																				.rowEditableState[
																				index
																			]
																		}
																	>
																		<CreateOutlined />
																	</IconButton>
																</StyledBaseTableCell>

																<StyledBaseTableCell
																	sx={{
																		width: "7%",
																	}}
																>
																	<IconButton
																		onClick={() =>
																			toggleRowEditState(
																				sheetKey,
																				index,
																			)
																		}
																	>
																		{state
																			.rowEditableState[
																			index
																		] ? (
																			<CloseIcon color="error" />
																		) : (
																			<AddIcon color="success" />
																		)}
																	</IconButton>
																</StyledBaseTableCell>
															</Table.Row>
														),
													)}
												</Table.Body>
											</Table>
										</StyledTableContainer>
									</Box>
								</Collapse>
							</StyledBodyWrapper>
						);
					})}
				</Box>
			))}

			<StyledFooterWrapper>
				<Button
					variant="outlined"
					color="primary"
					onClick={onCancel}
					data-test-id={"excel-cancel-button"}
				>
					Back
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={handleImport}
					data-test-id={"excel-import-button"}
				>
					Import
				</Button>
			</StyledFooterWrapper>

			<ColumnEditModal
				open={openModal}
				onClose={() => setOpenModal(false)}
				selectedColumn={selectedColumn}
				columnMetadata={
					selectedSheetKey
						? (tableStates[selectedSheetKey]?.columnMetadata ?? {})
						: {}
				}
				setColumnMetadata={setColumnMetadata}
			/>
		</>
	);
};

export default ExcelDataSelection;
