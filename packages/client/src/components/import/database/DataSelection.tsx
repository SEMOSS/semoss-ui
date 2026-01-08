import {
	CreateOutlined,
	ExpandMore,
	UnfoldLess,
	UnfoldMore,
} from "@mui/icons-material";
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
	Typography,
} from "@semoss/ui";
import ColumnEditModal from "./ColumnEditModal";
import { CSV_UPLOAD_ICONS } from "./database.constants";

const StyledHeaderWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	justifyContent: "space-between",
	alignItems: "center",
	marginBottom: theme.spacing(2),
}));

const StyledCollapseButton = styled(Button)(({ theme }) => ({
	borderRadius: theme.shape.borderRadius,
	textTransform: "capitalize",
	padding: theme.spacing(1, 3),
	minWidth: "160px",
	fontWeight: 600,
}));

const StyledBodyWrapper = styled("div")(({ theme }) => ({
	backgroundColor: "#fff",
	border: "1px solid #C4C4C4",
	borderRadius: theme.shape.borderRadius,
	overflow: "hidden",
	marginTop: 0,
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

const StyleFileNameBox = styled(Box)(({ theme }) => ({
	marginBottom: "15px",
}));

const StyledTypographyTableTitle = styled(Typography)({
	fontSize: "16px",
	color: "#212121",
	whiteSpace: "nowrap",
	position: "relative",
	top: "14px",
});

const StyledTableStack = styled(Stack)({
	flexDirection: "row",
	alignItems: "flex-start",
	gap: "6px",
});

const StyledTextFieldBox = styled(Box)({
	flex: 1,
});

const StyledTextFieldTypography = styled(Typography)({
	mt: 0.3,
	display: "block",
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
interface DataSelectionProps {
	files: ParsedResult[];
	fileName: string[];
	tableName: string[];
	onImport: (payload: Record<string, unknown>[]) => Promise<void>;
	onCancel: () => void;
}

interface ColumnMetadata {
	alias?: string;
	dataType?: string;
	format?: string;
	description?: string;
	logicalName?: string[];
}

const DataSelection = ({
	files,
	fileName,
	tableName,
	onImport,
	onCancel,
}: DataSelectionProps) => {
	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
		null,
	);

	const [columnMetadataList, setColumnMetadataList] = useState<
		Record<string, ColumnMetadata>[]
	>([]);
	const [collapseAll, setCollapseAll] = useState<boolean[]>(
		files.map(() => true),
	);
	const [rowEditableStateList, setRowEditableStateList] = useState<
		Record<number, boolean>[]
	>([]);
	const [tableNames, setTableNames] = useState<string[]>(tableName);

	// Initialize column metadata and row states for each file
	useEffect(() => {
		const metaList = files.map((parsedData) =>
			Object.fromEntries(
				parsedData.cleanHeaders.map((header) => [
					header,
					{
						alias: header,
						dataType: parsedData.dataTypes?.[header] || "String",
						format: "",
						description: "",
						logicalName: [],
					},
				]),
			),
		);
		setColumnMetadataList(metaList);

		const rowStateList = files.map((parsedData) =>
			Object.fromEntries(
				parsedData.cleanHeaders.map((_, index) => [index, true]),
			),
		);
		setRowEditableStateList(rowStateList);
	}, [files]);

	const handleNameChange = (
		fileIdx: number,
		index: number,
		newValue: string,
	) => {
		const column = files[fileIdx].cleanHeaders[index];
		setColumnMetadataList((prev) => {
			const clone = [...prev];
			clone[fileIdx] = {
				...clone[fileIdx],
				[column]: { ...clone[fileIdx][column], alias: newValue },
			};
			return clone;
		});
	};

	const toggleRowEditState = (fileIdx: number, index: number) => {
		setRowEditableStateList((prev) => {
			const clone = [...prev];
			clone[fileIdx] = {
				...clone[fileIdx],
				[index]: !clone[fileIdx][index],
			};
			return clone;
		});
	};

	const handleOpenModal = (fileIdx: number, column: string) => {
		setSelectedColumn(column);
		setSelectedFileIndex(fileIdx);
		setOpenModal(true);
	};

	const handleTableNameChange = (index: number, newValue: string) => {
		setTableNames((prev) => {
			const updated = [...prev];
			updated[index] = newValue;
			return updated;
		});
	};

	const handleImport = () => {
		const tables = files.map((parsedData, fileIdx) => {
			const originalHeaders = parsedData.cleanHeaders;
			const metadata = columnMetadataList[fileIdx];
			const rowState = rowEditableStateList[fileIdx];

			const activeHeaders = originalHeaders.filter(
				(_, index) => rowState[index],
			);

			const dataTypeMap: Record<string, string> = {};
			const newHeaders: Record<string, string> = {};
			const descriptionMap: Record<string, string> = {};
			const logicalNamesMap: Record<string, string[]> = {};
			const additionalDataTypes: Record<string, string> = {};

			activeHeaders.forEach((original) => {
				const userMeta = metadata[original] || {};
				const updated = userMeta.alias || original;
				const dataType =
					userMeta.dataType || parsedData.dataTypes[original];

				dataTypeMap[updated] = dataType;

				if (userMeta.alias && userMeta.alias !== original) {
					newHeaders[updated] = original;
				}
				if (userMeta.description) {
					descriptionMap[updated] = userMeta.description;
				}
				if (
					Array.isArray(userMeta.logicalName) &&
					userMeta.logicalName.length > 0
				) {
					logicalNamesMap[updated] = userMeta.logicalName;
				}
				if (userMeta.format) {
					additionalDataTypes[updated] = userMeta.format;
				}
			});

			return {
				fileName: fileName[fileIdx],
				table: tableNames[fileIdx],
				filePath: [fileName[fileIdx]],
				dataTypeMap,
				newHeaders,
				descriptionMap,
				logicalNamesMap,
				additionalDataTypes,
				existing: fileIdx > 0 ? true : false,
			};
		});

		onImport(tables);
	};
	const isAnyTableNameInvalid = tableNames.some((name) => !name?.trim());

	return (
		<>
			{files.map((parsedData, fileIdx) => (
				<StyleFileNameBox key={fileName[fileIdx]}>
					{/* Header Section */}
					<StyledHeaderWrapper>
						<Stack direction={"row"}>
							<img
								src={CSV_UPLOAD_ICONS.FILE_EXCEL}
								alt="Excel File"
							/>
							<StyledTypography variant="h6">
								{fileName[fileIdx]}
							</StyledTypography>
						</Stack>
						<StyledCollapseButton
							variant="outlined"
							size="large"
							data-testid="collapse-button"
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) =>
										i === fileIdx ? !v : v,
									),
								)
							}
							startIcon={
								collapseAll[fileIdx] ? (
									<UnfoldLess />
								) : (
									<UnfoldMore />
								)
							}
						>
							{collapseAll[fileIdx]
								? "Collapse All"
								: "Expand All"}
						</StyledCollapseButton>
					</StyledHeaderWrapper>

					{/* Body Section */}
					<StyledBodyWrapper>
						<StyledSummaryHeader
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) =>
										i === fileIdx ? !v : v,
									),
								)
							}
						>
							<StyledTypographyTitle variant="h6">
								Sheet Name: {fileName[fileIdx]}
							</StyledTypographyTitle>
							<StyledExpandMoreIcon
								collapse={collapseAll[fileIdx]}
								data-testid="expand-icon"
							>
								<ExpandMore />
							</StyledExpandMoreIcon>
						</StyledSummaryHeader>

						<Collapse in={collapseAll[fileIdx]}>
							<Box>
								<StyledInnerBox>
									<StyledTableStack>
										<StyledTypographyTableTitle variant="h6">
											Table Name:
										</StyledTypographyTableTitle>

										<StyledTextFieldBox>
											<TextField
												fullWidth
												size="small"
												placeholder="Enter table name"
												value={
													tableNames[fileIdx] || ""
												}
												onChange={(e) =>
													handleTableNameChange(
														fileIdx,
														e.target.value,
													)
												}
												data-testid="table-name-input"
												// @ts-expect-error TODO FIX
												error={
													!tableNames[fileIdx]?.trim()
												}
											/>
											{!tableNames[fileIdx]?.trim() && (
												<StyledTextFieldTypography
													variant="caption"
													color="error"
												>
													Enter a valid table name
												</StyledTextFieldTypography>
											)}
										</StyledTextFieldBox>
									</StyledTableStack>
								</StyledInnerBox>

								{/* Table Section */}
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
											{parsedData.cleanHeaders.map(
												(column, index) => (
													<Table.Row
														key={column}
														data-testid={`table-row-${fileIdx}-${index}`}
													>
														{/* Name */}
														<StyledBaseTableCellName
															data-testid={`table-cell-name-${fileIdx}-${index}`}
														>
															<StyedNameTextField
																fullWidth
																value={
																	columnMetadataList[
																		fileIdx
																	]?.[column]
																		?.alias ??
																	column
																}
																onChange={(e) =>
																	handleNameChange(
																		fileIdx,
																		index,
																		e.target
																			.value,
																	)
																}
																variant="outlined"
																size="small"
																disabled={
																	!rowEditableStateList[
																		fileIdx
																	]?.[index]
																}
																data-testid={`column-name-input-${fileIdx}-${index}`}
															/>
														</StyledBaseTableCellName>

														{/* Data Type */}
														<StyledBaseTableCell
															data-testid={`table-cell-datatype-${fileIdx}-${index}`}
														>
															<Typography
																variant="h6"
																sx={{
																	fontSize:
																		"14px",
																	color: !rowEditableStateList[
																		fileIdx
																	]?.[index]
																		? "#9E9E9E"
																		: "#212121",
																}}
																data-testid={`column-datatype-${fileIdx}-${index}`}
															>
																{columnMetadataList[
																	fileIdx
																]?.[column]
																	?.dataType ||
																	"STRING"}
															</Typography>
														</StyledBaseTableCell>

														{/* Edit */}
														<StyledBaseTableCellIcon
															data-testid={`table-cell-edit-${fileIdx}-${index}`}
														>
															<IconButton
																size="small"
																onClick={() =>
																	handleOpenModal(
																		fileIdx,
																		column,
																	)
																}
																disabled={
																	!rowEditableStateList[
																		fileIdx
																	]?.[index]
																}
																data-testid={`edit-button-${fileIdx}-${index}`}
															>
																<CreateOutlined />
															</IconButton>
														</StyledBaseTableCellIcon>

														{/* Toggle */}
														<StyledBaseTableCellIcon
															data-testid={`table-cell-toggle-${fileIdx}-${index}`}
														>
															<IconButton
																onClick={() =>
																	toggleRowEditState(
																		fileIdx,
																		index,
																	)
																}
																data-testid={`toggle-button-${fileIdx}-${index}`}
															>
																{rowEditableStateList[
																	fileIdx
																]?.[index] ? (
																	<CloseIcon
																		color="error"
																		data-testid={`toggle-icon-close-${fileIdx}-${index}`}
																	/>
																) : (
																	<AddIcon
																		color="success"
																		data-testid={`toggle-icon-add-${fileIdx}-${index}`}
																	/>
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
				</StyleFileNameBox>
			))}

			{/* Footer */}
			<StyledFooterWrapper>
				<Button
					variant="outlined"
					color="primary"
					onClick={onCancel}
					data-testid="back-button"
				>
					Back
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={handleImport}
					disabled={isAnyTableNameInvalid}
					data-testid="import-button"
				>
					Import
				</Button>
			</StyledFooterWrapper>

			{/* Modal */}
			{selectedFileIndex !== null && (
				<ColumnEditModal
					open={openModal}
					onClose={() => setOpenModal(false)}
					selectedColumn={selectedColumn}
					columnMetadata={columnMetadataList[selectedFileIndex]}
					setColumnMetadata={(updated) =>
						setColumnMetadataList((prev) => {
							const clone = [...prev];
							clone[selectedFileIndex] =
								typeof updated === "function"
									? updated(clone[selectedFileIndex])
									: updated;
							return clone;
						})
					}
				/>
			)}
		</>
	);
};

export default DataSelection;
