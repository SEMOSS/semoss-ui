import { CreateOutlined, ExpandMore } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import {
	Autocomplete,
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

const StyledTextField = styled(TextField)({
	width: "220px",
	"& .MuiInputBase-input": {
		padding: "4px 8px",
	},
});

const StyledStack = styled(Stack)({
	flexDirection: "row",
	alignItems: "flex-start",
	flexWrap: "wrap",
	gap: "16px",
	width: "100%",
});

const StyledBox = styled(Box)({
	display: "flex",
	flexDirection: "column",
});

const StyledErrorTypography = styled(Typography)({
	color: "#d32f2f",
	fontSize: "0.75rem",
	lineHeight: "1rem",
	whiteSpace: "normal",
	wordBreak: "break-word",
});

const StyledRangeTypography = styled(Typography)({
	color: "#757575",
	fontStyle: "italic",
	whiteSpace: "nowrap",
	"&.MuiTypography-root": {
		marginTop: "5px",
	},
});
const StyledTableCellName = styled(StyledBaseTableCell)(({ theme }) => ({
	padding: theme.spacing(1, 3, 1, 2),
	width: "66%",
}));
const StyledTableCellDataType = styled(StyledBaseTableCell)(({ theme }) => ({
	padding: theme.spacing(1, 3, 1, 2),
	width: "20%",
}));
const StyledTable = styled(StyledBaseTableCell)(({ theme }) => ({
	padding: theme.spacing(1, 3, 1, 2),
	width: "7%",
}));
const StyledBaseTableCellName = styled(Table.Cell)(({ theme }) => ({
	borderBottom: 0,
	boxShadow: `0px -1px 0px 0px ${theme.palette.grey[300]} inset`,
	width: "66%",
}));
const StyledBaseTableCellIcon = styled(Table.Cell)(({ theme }) => ({
	borderBottom: 0,
	boxShadow: `0px -1px 0px 0px ${theme.palette.grey[300]} inset`,
	width: "7%",
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

interface RangeOption {
	label: string;
	value: "actual" | "custom" | "typed";
}

const ExcelDataSelection = ({
	files,
	fileName,
	onImport,
	onCancel,
}: ExcelDataSelectionProps) => {
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
	const [selectedRangeOption, setSelectedRangeOption] = useState<
		Record<string, "actual" | "custom" | "typed">
	>({});
	const [customRangeValues, setCustomRangeValues] = useState<
		Record<string, string>
	>({});
	const [editedRanges, setEditedRanges] = useState<Record<string, string>>(
		{},
	);

	const { monolithStore } = useRootStore();

	const handlePreviewRange = async (
		filePath: string,
		sheetKey: string,
		sheetName: string,
		customRangeValues: string,
	) => {
		setEditedRanges((prev) => ({
			...prev,
			[sheetKey]: customRangeValues,
		}));
		setSelectedRangeOption((prev) => ({
			...prev,
			[sheetKey]: "actual",
		}));

		try {
			const pixelExpression = `META|PredictExcelRangeMetadata(filePath=["${filePath}"], sheetName=["${sheetName}"], sheetRange=["${customRangeValues}"]);`;
			const response = await monolithStore.runQuery(pixelExpression);

			const result: ParsedResult = response.pixelReturn[0].output;

			if (!result?.cleanHeaders || !result?.dataTypes) {
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

				state.cleanHeaders?.forEach((header, index) => {
					if (!state.rowEditableState[index]) return;
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
						Array.isArray(
							state.columnMetadata[header]?.logicalName,
						) &&
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
				<Box key={fileName[fileIndex]}>
					<StyledHeaderWrapper key={fileName[fileIndex]}>
						<Stack direction={"row"}>
							<img
								src={CSV_UPLOAD_ICONS.FILE_EXCEL}
								alt="Excel File"
							/>
							<StyledTypography variant="h6">
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
									<StyledTypographyTitle variant="h6">
										Sheet Name: {sheetName}
									</StyledTypographyTitle>
									<StyledExpandMoreIcon
										collapse={state.collapseAll}
										data-testid="expand-icon"
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
												<StyledTextField
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
													data-testid="table-name-input"
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
												data-testid="select-all-button"
											>
												{Object.values(
													state.rowEditableState,
												).every((v) => v)
													? "Unselect All"
													: "Select All"}
											</StyledSelectAllButton>
										</StyledInnerBox>

										<Stack padding={2}>
											<Stack spacing={1}>
												<Stack>
													{(() => {
														const currentValue =
															editedRanges[
																sheetKey
															] ?? range;
														const optionValue =
															selectedRangeOption[
																sheetKey
															] ??
															(currentValue ===
															range
																? "actual"
																: "custom");

														const customValue =
															customRangeValues[
																sheetKey
															] ?? currentValue;

														const isValidFormat =
															/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.test(
																customValue,
															);
														const isSameRange =
															customValue.toUpperCase() ===
															range.toUpperCase();
														const showError =
															optionValue ===
																"custom" &&
															(!isValidFormat ||
																(!isSmallerRange(
																	range,
																	customValue,
																) &&
																	!isSameRange));

														const errorText =
															!isValidFormat
																? "Invalid format. Use A1:H51 style."
																: isSameRange
																	? "Range must differ from the actual range."
																	: !isSmallerRange(
																				range,
																				customValue,
																			)
																		? `Range must be smaller than the actual rangeActual range: ${range} .`
																		: "";

														return (
															<StyledBox>
																{/* Dropdown for selecting range type */}
																<Autocomplete<
																	RangeOption,
																	false,
																	false,
																	false
																>
																	size="small"
																	freeSolo={
																		false
																	}
																	fullWidth
																	label="Selected Table"
																	options={[
																		{
																			label: range,
																			value: "actual",
																		},
																		{
																			label: "Custom Range",
																			value: "custom",
																		},
																	]}
																	value={
																		selectedRangeOption[
																			sheetKey
																		] ===
																		"custom"
																			? {
																					label: "Custom Range",
																					value: "custom",
																				}
																			: {
																					label:
																						editedRanges[
																							sheetKey
																						] ||
																						range,
																					value: "actual",
																				}
																	}
																	onChange={async (
																		_event,
																		newValue: RangeOption | null,
																	) => {
																		if (
																			!newValue
																		)
																			return;

																		if (
																			newValue.value ===
																			"custom"
																		) {
																			// Show empty textfield
																			setSelectedRangeOption(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						"custom",
																				}),
																			);
																			setCustomRangeValues(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						"",
																				}),
																			);
																		} else {
																			setSelectedRangeOption(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						"actual",
																				}),
																			);
																			setEditedRanges(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						range,
																				}),
																			);
																			setCustomRangeValues(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						"",
																				}),
																			);
																			await handlePreviewRange(
																				fileName[
																					fileIndex
																				],
																				sheetKey,
																				sheetName,
																				range,
																			);
																		}
																	}}
																	filterOptions={(
																		options,
																	) =>
																		options
																	}
																	getOptionLabel={(
																		option: RangeOption,
																	) =>
																		option?.label ??
																		String(
																			option,
																		)
																	}
																	renderInput={(
																		params,
																	) => (
																		<TextField
																			{...params}
																			label="Select Range"
																			placeholder=""
																			InputProps={{
																				...params.InputProps,
																				endAdornment:
																					params
																						.InputProps
																						.endAdornment, // keeps dropdown arrow
																			}}
																		/>
																	)}
																/>
																{/* Only show text field + preview if "Custom Range" is selected */}
																{optionValue ===
																	"custom" && (
																	<Stack
																		spacing={
																			1
																		}
																		mt={2}
																	>
																		<StyledTypographyTitle variant="h6">
																			Custom
																			Range
																		</StyledTypographyTitle>
																		<Stack
																			direction={
																				"row"
																			}
																			spacing={
																				1
																			}
																			alignItems={
																				"center"
																			}
																			justifyContent="center"
																		>
																			<TextField
																				size="medium"
																				value={
																					customValue
																				}
																				onChange={(
																					e,
																				) =>
																					setCustomRangeValues(
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

																			{(() => {
																				const userTyped =
																					customValue.trim()
																						.length >
																					0;
																				const isSmaller =
																					isValidFormat &&
																					isSmallerRange(
																						range,
																						customValue,
																					);
																				const enablePreview =
																					userTyped &&
																					isValidFormat &&
																					(isSameRange ||
																						isSmaller);

																				return !enablePreview ? (
																					<Tooltip
																						title={
																							!isValidFormat
																								? "Invalid format (e.g. A1:H51)"
																								: "Range must be smaller or equal to the actual range"
																						}
																					>
																						<span>
																							<Button
																								size="medium"
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
																						size="medium"
																						variant="outlined"
																						color="primary"
																						onClick={() =>
																							handlePreviewRange(
																								fileName[
																									fileIndex
																								],
																								sheetKey,
																								sheetName,
																								customValue,
																							)
																						}
																						data-testid="preview-button"
																					>
																						Preview
																					</Button>
																				);
																			})()}
																		</Stack>

																		{showError && (
																			<StyledErrorTypography variant="body2">
																				{
																					errorText
																				}
																			</StyledErrorTypography>
																		)}
																	</Stack>
																)}
															</StyledBox>
														);
													})()}
												</Stack>
											</Stack>
										</Stack>

										<StyledTableContainer>
											<Table>
												<Table.Head>
													<Table.Row>
														<StyledTableCellName>
															<StyledTableTypography variant="h6">
																Name
															</StyledTableTypography>
														</StyledTableCellName>
														<StyledTableCellDataType>
															<StyledTableTypography variant="h6">
																Data Type
															</StyledTableTypography>
														</StyledTableCellDataType>
														<StyledTable />
														<StyledTable />
													</Table.Row>
												</Table.Head>

												<Table.Body>
													{state.cleanHeaders?.map(
														(column, index) => (
															<Table.Row
																key={column}
																data-testid={`column-row-${column}-${index}`}
															>
																<StyledBaseTableCellName>
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
																		data-testid={`column-name-input-${column}-${index}`}
																	/>
																</StyledBaseTableCellName>

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
																		data-testid={`column-datatype-${column}-${index}`}
																	>
																		{state
																			.columnMetadata[
																			column
																		]
																			?.dataType ||
																			"STRING"}
																	</Typography>
																</StyledBaseTableCell>

																<StyledBaseTableCellIcon>
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
																		data-testid={`edit-button-${column}-${index}`}
																	>
																		<CreateOutlined />
																	</IconButton>
																</StyledBaseTableCellIcon>

																<StyledBaseTableCellIcon>
																	<IconButton
																		onClick={() =>
																			toggleRowEditState(
																				sheetKey,
																				index,
																			)
																		}
																		data-testid={`toggle-editable-button-${column}-${index}`}
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
																</StyledBaseTableCellIcon>
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
					data-testid={"excel-cancel-button"}
				>
					Back
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={handleImport}
					data-testid={"excel-import-button"}
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
