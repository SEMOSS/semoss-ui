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
}));

interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
}
interface DataSelectionProps {
	files: ParsedResult[];
	fileName: string;
	onImport: (payload: Record<string, unknown>) => Promise<void>;
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
	onImport,
	onCancel,
}: DataSelectionProps) => {
	const parsedData = files[0];
	const [rowEditableState, setRowEditableState] = useState<{
		[key: number]: boolean;
	}>(
		Object.fromEntries(
			parsedData.cleanHeaders.map((_, index) => [index, true]),
		),
	);
	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [columnMetadata, setColumnMetadata] = useState<{
		[column: string]: ColumnMetadata;
	}>({});
	const [collapseAll, setCollapseAll] = useState(true);

	useEffect(() => {
		if (parsedData?.cleanHeaders) {
			const initialMeta = Object.fromEntries(
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
			);
			setColumnMetadata(initialMeta);
		}
	}, [parsedData]);

	const handleNameChange = (index: number, newValue: string) => {
		const column = parsedData.cleanHeaders[index];
		setColumnMetadata((prev) => ({
			...prev,
			[column]: { ...prev[column], alias: newValue },
		}));
	};

	const toggleRowEditState = (index: number) => {
		setRowEditableState((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	const handleOpenModal = (column: string) => {
		setSelectedColumn(column);
		setOpenModal(true);
	};

	const handleImport = () => {
		const originalHeaders = parsedData.cleanHeaders;
		const updatedHeaders = originalHeaders.map(
			(header) => columnMetadata[header]?.alias || header,
		);

		const dataTypeMap: Record<string, string> = {};
		const newHeaders: Record<string, string> = {};
		const descriptionMap: Record<string, string> = {};
		const logicalNamesMap: Record<string, string[]> = {};
		const additionalDataTypes: Record<string, string> = {};

		originalHeaders.forEach((original, index) => {
			const updated = updatedHeaders[index];
			const userMeta = columnMetadata[original] || {};
			const dataType =
				userMeta.dataType || parsedData.dataTypes[original];
			const alias = userMeta.alias;

			dataTypeMap[updated] = dataType;

			if (alias && alias !== original) {
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

		onImport({
			...files,
			dataTypeMap,
			newHeaders,
			descriptionMap: Object.keys(descriptionMap).length
				? descriptionMap
				: {},
			logicalNamesMap: Object.keys(logicalNamesMap).length
				? logicalNamesMap
				: {},
			additionalDataTypes: Object.keys(additionalDataTypes).length
				? additionalDataTypes
				: {},
		});
	};

	return (
		<>
			<StyledHeaderWrapper>
				<Stack direction={"row"}>
					<img src={CSV_UPLOAD_ICONS.FILE_EXCEL} alt="Excel File" />
					<StyledTypography variant="h6">{fileName}</StyledTypography>
				</Stack>
				<StyledCollapseButton
					variant="outlined"
					size="large"
					onClick={() => setCollapseAll(!collapseAll)}
					startIcon={collapseAll ? <UnfoldLess /> : <UnfoldMore />}
				>
					{collapseAll ? "Collapse All" : "Expand All"}
				</StyledCollapseButton>
			</StyledHeaderWrapper>

			<StyledBodyWrapper>
				{/* Summary Header */}
				<StyledSummaryHeader
					onClick={() => setCollapseAll(!collapseAll)}
				>
					<StyledTypographyTitle variant="h6">
						Sheet Name : {fileName}
					</StyledTypographyTitle>
					<StyledExpandMoreIcon collapse={collapseAll}>
						<ExpandMore />
					</StyledExpandMoreIcon>
				</StyledSummaryHeader>

				{/* Collapsible Content */}
				<Collapse in={collapseAll}>
					<Box>
						<StyledInnerBox>
							<StyledTypographyTitle variant="h6">
								Table Name: {fileName}
							</StyledTypographyTitle>
							<StyledSelectAllButton
								size="small"
								variant="text"
								color="primary"
								onClick={() => {
									const areAllSelected = Object.values(
										rowEditableState,
									).every((row) => row);
									const newState = Object.fromEntries(
										Object.keys(rowEditableState).map(
											(key) => [key, !areAllSelected],
										),
									);
									setRowEditableState(newState);
								}}
							>
								{Object.values(rowEditableState).every((v) => v)
									? "Unselect All"
									: "Select All"}
							</StyledSelectAllButton>
						</StyledInnerBox>

						{/* Table */}
						<StyledTableContainer>
							<Table>
								<Table.Head>
									<Table.Row>
										<StyledTableCell sx={{ width: "66%" }}>
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
											sx={{
												width: "7%",
											}}
										/>
										<StyledTableCell
											sx={{
												width: "7%",
											}}
										/>
									</Table.Row>
								</Table.Head>

								<Table.Body>
									{parsedData.cleanHeaders.map(
										(column, index) => (
											<Table.Row key={column}>
												{/* Name */}
												<StyledBaseTableCell
													sx={{
														width: "66%",
													}}
												>
													<StyedNameTextField
														fullWidth
														value={
															columnMetadata[
																column
															]?.alias ?? column
														}
														onChange={(e) =>
															handleNameChange(
																index,
																e.target.value,
															)
														}
														variant="outlined"
														size="small"
														disabled={
															!rowEditableState[
																index
															]
														}
													/>
												</StyledBaseTableCell>

												{/* Data Type */}
												<StyledBaseTableCell
													sx={{
														width: "20%",
														pointerEvents:
															!rowEditableState[
																index
															]
																? "none"
																: "auto",
													}}
												>
													<Typography
														variant="h6"
														sx={{
															fontSize: "14px",
															color: !rowEditableState[
																index
															]
																? "#9E9E9E"
																: "#212121",
														}}
													>
														{columnMetadata[column]
															?.dataType ||
															"STRING"}
													</Typography>
												</StyledBaseTableCell>

												{/* Edit Button */}
												<StyledBaseTableCell
													sx={{
														width: "7%",
													}}
												>
													<IconButton
														size="small"
														onClick={() =>
															handleOpenModal(
																column,
															)
														}
														disabled={
															!rowEditableState[
																index
															]
														}
													>
														<CreateOutlined />
													</IconButton>
												</StyledBaseTableCell>
												{/* Toggle Button */}
												<StyledBaseTableCell
													sx={{
														width: "7%",
													}}
												>
													<IconButton
														onClick={() =>
															toggleRowEditState(
																index,
															)
														}
													>
														{rowEditableState[
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

			<StyledFooterWrapper>
				<Button variant="outlined" color="primary" onClick={onCancel}>
					Back
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={handleImport}
				>
					Import
				</Button>
			</StyledFooterWrapper>

			<ColumnEditModal
				open={openModal}
				onClose={() => setOpenModal(false)}
				selectedColumn={selectedColumn}
				columnMetadata={columnMetadata}
				setColumnMetadata={setColumnMetadata}
			/>
		</>
	);
};

export default DataSelection;
