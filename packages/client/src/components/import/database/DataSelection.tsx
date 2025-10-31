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
interface DataSelectionProps {
	files: ParsedResult[];
	fileName: string[];
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

const DataSelection = ({ files, fileName, onImport, onCancel }: DataSelectionProps) => {
	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

	const [columnMetadataList, setColumnMetadataList] = useState<
		Record<string, ColumnMetadata>[]
	>([]);
	const [collapseAll, setCollapseAll] = useState<boolean[]>(files.map(() => true));
	const [rowEditableStateList, setRowEditableStateList] = useState<
		Record<number, boolean>[]
	>([]);
	const [tableNames, setTableNames] = useState<string[]>(fileName);
	const [tableNameErrors, setTableNameErrors] = useState<string[]>(fileName.map(() => ""));

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
			Object.fromEntries(parsedData.cleanHeaders.map((_, index) => [index, true])),
		);
		setRowEditableStateList(rowStateList);
	}, [files]);

	const handleNameChange = (fileIdx: number, index: number, newValue: string) => {
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

	// Live validation
	setTableNameErrors((prev) => {
		const updated = [...prev];
		if (!newValue.trim()) {
			updated[index] = "Enter valid table name";
		} else {
			updated[index] = "";
		}
		return updated;
	});
};


	const handleImport = () => {
	if (tableNames.some((name) => !name.trim())) {
		setTableNameErrors(
			tableNames.map((n) => (!n.trim() ? "Enter valid table name" : "")),
		);
		return;
	}

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
			const dataType = userMeta.dataType || parsedData.dataTypes[original];

			dataTypeMap[updated] = dataType;

			if (userMeta.alias && userMeta.alias !== original) {
				newHeaders[updated] = original;
			}
			if (userMeta.description) {
				descriptionMap[updated] = userMeta.description;
			}
			if (Array.isArray(userMeta.logicalName) && userMeta.logicalName.length > 0) {
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
				<Box key={fileName[fileIdx]} sx={{marginBottom:"15px"}}>
					{/* Header Section */}
					<StyledHeaderWrapper>
						<Stack direction={"row"}>
							<img src={CSV_UPLOAD_ICONS.FILE_EXCEL} alt="Excel File" />
							<StyledTypography variant="h6">
								{fileName[fileIdx]}
							</StyledTypography>
						</Stack>
						<StyledCollapseButton
							variant="outlined"
							size="large"
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) => (i === fileIdx ? !v : v)),
								)
							}
							startIcon={
								collapseAll[fileIdx] ? <UnfoldLess /> : <UnfoldMore />
							}
						>
							{collapseAll[fileIdx] ? "Collapse All" : "Expand All"}
						</StyledCollapseButton>
					</StyledHeaderWrapper>

					{/* Body Section */}
					<StyledBodyWrapper>
						<StyledSummaryHeader
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) => (i === fileIdx ? !v : v)),
								)
							}
						>
							<StyledTypographyTitle variant="h6">
								Sheet Name: {fileName[fileIdx]}
							</StyledTypographyTitle>
							<StyledExpandMoreIcon collapse={collapseAll[fileIdx]}>
								<ExpandMore />
							</StyledExpandMoreIcon>
						</StyledSummaryHeader>

						<Collapse in={collapseAll[fileIdx]}>
							<Box>
								<StyledInnerBox>
  <Stack direction="row" alignItems="flex-start" spacing={2}>
    <StyledTypographyTitle variant="h6" sx={{ whiteSpace: "nowrap",
	position: "relative",
	top: "6px",
	}}>
      Table Name:
    </StyledTypographyTitle>

    <Box sx={{ flex: 1 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Enter table name"
        value={tableNames[fileIdx] || ""}
        onChange={(e) => handleTableNameChange(fileIdx, e.target.value)}
        error={!tableNames[fileIdx]?.trim()}
      />
      {!tableNames[fileIdx]?.trim() && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.3, display: "block" }}
        >
          Enter a valid table name
        </Typography>
      )}
    </Box>
  </Stack>
</StyledInnerBox>


								{/* Table Section */}
								<StyledTableContainer>
									<Table>
										<Table.Head>
											<Table.Row>
												<StyledTableCell sx={{ width: "66%" }}>
													<StyledTableTypography variant="h6">
														Name
													</StyledTableTypography>
												</StyledTableCell>
												<StyledTableCell sx={{ width: "20%" }}>
													<StyledTableTypography variant="h6">
														Data Type
													</StyledTableTypography>
												</StyledTableCell>
												<StyledTableCell sx={{ width: "7%" }} />
												<StyledTableCell sx={{ width: "7%" }} />
											</Table.Row>
										</Table.Head>

										<Table.Body>
											{parsedData.cleanHeaders.map((column, index) => (
												<Table.Row key={column}>
													{/* Name */}
													<StyledBaseTableCell sx={{ width: "66%" }}>
														<StyedNameTextField
															fullWidth
															value={
																columnMetadataList[fileIdx]?.[column]?.alias ??
																column
															}
															onChange={(e) =>
																handleNameChange(
																	fileIdx,
																	index,
																	e.target.value,
																)
															}
															variant="outlined"
															size="small"
															disabled={
																!rowEditableStateList[fileIdx]?.[index]
															}
														/>
													</StyledBaseTableCell>

													{/* Data Type */}
													<StyledBaseTableCell sx={{ width: "20%" }}>
														<Typography
															variant="h6"
															sx={{
																fontSize: "14px",
																color: !rowEditableStateList[fileIdx]?.[index]
																	? "#9E9E9E"
																	: "#212121",
															}}
														>
															{columnMetadataList[fileIdx]?.[column]?.dataType ||
																"STRING"}
														</Typography>
													</StyledBaseTableCell>

													{/* Edit */}
													<StyledBaseTableCell sx={{ width: "7%" }}>
														<IconButton
															size="small"
															onClick={() =>
																handleOpenModal(fileIdx, column)
															}
															disabled={
																!rowEditableStateList[fileIdx]?.[index]
															}
														>
															<CreateOutlined />
														</IconButton>
													</StyledBaseTableCell>

													{/* Toggle */}
													<StyledBaseTableCell sx={{ width: "7%" }}>
														<IconButton
															onClick={() =>
																toggleRowEditState(fileIdx, index)
															}
														>
															{rowEditableStateList[fileIdx]?.[index] ? (
																<CloseIcon color="error" />
															) : (
																<AddIcon color="success" />
															)}
														</IconButton>
													</StyledBaseTableCell>
												</Table.Row>
											))}
										</Table.Body>
									</Table>
								</StyledTableContainer>
							</Box>
						</Collapse>
					</StyledBodyWrapper>
				</Box>
			))}

			{/* Footer */}
			<StyledFooterWrapper>
				<Button variant="outlined" color="primary" onClick={onCancel}>
					Back
				</Button>
				<Button variant="contained" color="primary" onClick={handleImport} disabled={isAnyTableNameInvalid}>
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
