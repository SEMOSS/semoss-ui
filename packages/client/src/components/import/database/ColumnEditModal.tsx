import { Add, Delete } from "@mui/icons-material";
import { useEffect, useState } from "react";
import {
	Box,
	Button,
	IconButton,
	Menu,
	Modal,
	Select,
	Stack,
	styled,
	Tab,
	Table,
	Tabs,
	TextField,
	Typography,
} from "@semoss/ui";
import { formatOptions } from "./formatOptions.constants";

const StyledBaseTableCell = styled(Table.Cell)(({ theme }) => ({
	border: "1px solid lightgray",
	padding: theme.spacing(0.5, 1.24),
}));

const StyledTableCellHeading = styled(StyledBaseTableCell)({
	backgroundColor: "#f6f6f6",
});

const StyledTabs = styled(Tabs)(({ theme }) => ({
	marginBottom: theme.spacing(2),
	alignSelf: "flex-start",
}));

const StyledModalContent = styled(Modal.Content)({
	display: "flex",
	flexDirection: "column",
	height: "100%",
});

const StyledFormTable = styled(Table)(({ theme }) => ({
	marginBottom: theme.spacing(2),
}));

const StyledFormDiv = styled("div")({});

const StyledTextField = styled(TextField)(({ theme }) => ({
	"& .MuiInputBase-input": {
		padding: theme.spacing(2),
		fontSize: "14px",
	},
}));

const StyledSelectField = styled(Select)(({ theme }) => ({
	marginTop: theme.spacing(3),
	"& .MuiInputBase-input": {
		padding: theme.spacing(2),
		fontSize: "14px",
	},
}));

const StyledModalBox = styled(Box)(({ theme }) => ({
	flex: "1",
	overflowY: "auto",
	padding: `${theme.spacing(3)} 0 ${theme.spacing(1)}`,
}));

const StyledModalFooter = styled(Box)(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	padding: theme.spacing(1),
}));

const StyledTypography = styled(Typography)({
	fontSize: "14px",
	color: "#666",
	fontWeight: "600",
	marginBottom: 1,
});

interface ColumnEditModalProps {
	open: boolean;
	onClose: () => void;
	selectedColumn: string | null;
	columnMetadata: {
		[column: string]: {
			alias?: string;
			dataType?: string;
			format?: string;
			description?: string;
			logicalName?: string[];
		};
	};
	setColumnMetadata: React.Dispatch<
		React.SetStateAction<{
			[column: string]: {
				alias?: string;
				dataType?: string;
				format?: string;
				description?: string;
				logicalName?: string[];
			};
		}>
	>;
}

const ColumnEditModal = ({
	open,
	onClose,
	selectedColumn,
	columnMetadata,
	setColumnMetadata,
}: ColumnEditModalProps) => {
	const [tab, setTab] = useState<unknown>(0);
	const [editAlias, setEditAlias] = useState("");
	const [selectedDataType, setSelectedDataType] = useState("");
	const [selectedFormat, setSelectedFormat] = useState("");
	const [description, setDescription] = useState("");
	const [logicalName, setLogicalName] = useState("");
	const [logicalNamesList, setLogicalNamesList] = useState<string[]>([]);
	const [availableFormats, setAvailableFormats] = useState<
		{ display: string; value: string }[]
	>([]);

	const dataTypeOptions = [
		{ label: "String", value: "STRING" },
		{ label: "Integer", value: "INT" },
		{ label: "Double", value: "DOUBLE" },
		{ label: "Date", value: "DATE" },
		{ label: "Timestamp", value: "TIMESTAMP" },
	];

	useEffect(() => {
		if (selectedColumn && columnMetadata[selectedColumn]) {
			const meta = columnMetadata[selectedColumn];
			setEditAlias(meta.alias || "");
			setSelectedDataType(meta.dataType || "STRING");
			setSelectedFormat(meta.format || "");
			setDescription(meta.description || "");
			setLogicalNamesList(meta.logicalName || []);
		}
	}, [selectedColumn, columnMetadata, open]);

	useEffect(() => {
		if (selectedDataType) {
			const optionsList = formatOptions.find(
				(opt) => opt.value === selectedDataType,
			);
			if (optionsList) {
				setAvailableFormats(optionsList.formats || []);
				const defaultFormat = optionsList.formats?.find(
					(f) => f.isDefault,
				);
				if (!selectedFormat) {
					setSelectedFormat(defaultFormat?.value || "");
				}
			} else {
				setAvailableFormats([]);
				setSelectedFormat("");
			}
		}
	}, [selectedDataType]);

	const handleAddLogicalName = () => {
		if (logicalName.trim()) {
			setLogicalNamesList((prev) => [...prev, logicalName.trim()]);
			setLogicalName("");
		}
	};

	const handleDeleteLogicalName = (index: number) => {
		setLogicalNamesList((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSaveMetadata = () => {
		if (!selectedColumn) return;

		setColumnMetadata((prev) => ({
			...prev,
			[selectedColumn]: {
				...prev[selectedColumn],
				alias: editAlias,
				dataType: selectedDataType,
				format: selectedFormat,
				description,
				logicalName: logicalNamesList,
			},
		}));

		onClose();
	};

	return (
		<Modal open={open} onClose={onClose}>
			<Modal.Title>Edit {selectedColumn}</Modal.Title>
			<StyledModalContent>
				<StyledTabs
					value={tab}
					onChange={(_, newValue) => setTab(newValue)}
				>
					<Tab label="Settings" />
					<Tab label="Description" />
					<Tab label="Logical Names" />
					<Tab label="Sample Instances" disabled />
				</StyledTabs>
				<StyledModalBox>
					{tab === 0 && (
						<StyledFormDiv>
							<StyledTextField
								fullWidth
								label="Edit Alias"
								value={editAlias}
								onChange={(e) => setEditAlias(e.target.value)}
							/>
							<StyledSelectField
								size="small"
								fullWidth
								label="Select a DataType"
								value={selectedDataType}
								onChange={(e) =>
									setSelectedDataType(e.target.value)
								}
							>
								{dataTypeOptions.map((option) => (
									<Menu.Item
										key={option.value}
										value={option.value}
									>
										{option.label}
									</Menu.Item>
								))}
							</StyledSelectField>
							{selectedDataType !== "STRING" && (
								<StyledSelectField
									size="small"
									fullWidth
									label="Select a Format"
									value={selectedFormat}
									onChange={(e) =>
										setSelectedFormat(e.target.value)
									}
								>
									{availableFormats.map((fmt) => (
										<Menu.Item
											key={fmt.value}
											value={fmt.value}
										>
											{fmt.display}
										</Menu.Item>
									))}
								</StyledSelectField>
							)}
						</StyledFormDiv>
					)}

					{tab === 1 && (
						<StyledFormDiv>
							<TextField
								fullWidth
								label="Edit Description"
								multiline
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								sx={{ mb: 2 }}
							/>
							{/* <Button
								variant="outlined"
								color="secondary"
								disabled
							>
								Predict
							</Button> */}
						</StyledFormDiv>
					)}

					{tab === 2 && (
						<StyledFormDiv>
							<Stack>
								<StyledTypography variant="h6">
									Current Logical Name(s):
								</StyledTypography>
							</Stack>
							<StyledFormTable>
								<Table.Head>
									<Table.Row>
										<StyledTableCellHeading
											sx={{
												width: "95%",
											}}
										>
											Name
										</StyledTableCellHeading>
										<StyledTableCellHeading
											sx={{
												width: "5%",
											}}
										></StyledTableCellHeading>
									</Table.Row>
								</Table.Head>
								<Table.Body>
									{logicalNamesList.map((name, index) => (
										<Table.Row key={name}>
											<StyledBaseTableCell
												sx={{
													width: "95%",
												}}
											>
												{name}
											</StyledBaseTableCell>
											<StyledBaseTableCell
												sx={{
													width: "5%",
												}}
											>
												<IconButton
													color="secondary"
													onClick={() =>
														handleDeleteLogicalName(
															index,
														)
													}
													size="small"
												>
													<Delete fontSize="small" />
												</IconButton>
											</StyledBaseTableCell>
										</Table.Row>
									))}
								</Table.Body>
							</StyledFormTable>
							<Stack>
								<StyledTypography variant="h6">
									Enter New Logical Name:
								</StyledTypography>
							</Stack>
							<Stack
								direction="row"
								spacing={1}
								alignItems="center"
								sx={{ mb: 2 }}
							>
								<TextField
									size="small"
									value={logicalName}
									onChange={(e) =>
										setLogicalName(e.target.value)
									}
								/>
								<IconButton
									onClick={handleAddLogicalName}
									disabled={!logicalName.trim()}
								>
									<Add />
								</IconButton>
							</Stack>
							{/* <Button
								variant="outlined"
								color="secondary"
								disabled
							>
								Predict
							</Button> */}
						</StyledFormDiv>
					)}

					{tab === 3 && <TextField fullWidth label="Search" />}
				</StyledModalBox>
				<StyledModalFooter>
					<Button onClick={onClose} variant="outlined" sx={{ mr: 2 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						color="primary"
						onClick={handleSaveMetadata}
					>
						Save
					</Button>
				</StyledModalFooter>
			</StyledModalContent>
		</Modal>
	);
};

export default ColumnEditModal;
