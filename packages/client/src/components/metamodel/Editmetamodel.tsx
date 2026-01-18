import { Add, Close, Delete } from "@mui/icons-material";
import type React from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	Autocomplete,
	Box,
	Button,
	FormControl,
	IconButton,
	Modal,
	styled,
	Tab,
	Table,
	Tabs,
	TextArea,
	TextField,
	Typography,
} from "@semoss/ui";

interface EditMetamodelProps {
	open: boolean;
	onClose: () => void;
	initialName?: string;
	initialType?: string;
	onSave: (payload: {
		name: string;
		type: string;
		logicalNames?: string[];
		description?: string;
	}) => void;
	types?: string[];
	isEdit?: boolean;
	initialDescription?: string;
	initialLogicalNames?: string[];
	existingColumnNames?: string[];
}

const StyledTab = styled(Tab)(() => ({
	padding: "12px 16px",
}));
const ModalTitle = styled(Modal.Title)({ padding: "8px 24px" });
const ModalContent = styled(Modal.Content)({ padding: "18px 24px" });
const ModalActions = styled(Modal.Actions)({ padding: "8px 18px" });
const StyledCloseIconButton = styled(IconButton)({
	position: "absolute",
	right: "8px",
	top: "15px",
});
const StyledContainer = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	gap: 2,
	p: 2,
}));

const StyledLabel = styled(Typography)(() => ({
	marginBottom: 1,
	display: "block",
	fontSize: 13,
}));

const StyledTabsBox = styled(Box)(() => ({
	borderBottom: "8px",
	borderColor: "divider",
	margin: "0px 24px",
}));

const StyledBox = styled(Box)(() => ({
	p: 2,
}));

const StyledDescriptionBox = styled(Box)(() => ({
	p: 2,
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	minHeight: 120,
}));

const TableContainer = styled(Table.Container)(() => ({
	border: 1,
	borderColor: "divider",
	maxHeight: "200px",
	overflow: "auto",
	marginBottom: "8px",
}));

const TableHeader = styled(Table.Head)(({ theme }) => ({
	backgroundColor: theme.palette.primary.hover,
}));
const TableHeaderCell = styled(Table.Cell)(({ theme }) => ({
	padding: "10px",
	fontWeight: 600,
	color: theme.palette.primary.main,
	backgroundColor: theme.palette.primary.hover,
}));

const TableActions = styled(Table.Cell)(({ theme }) => ({
	fontWeight: 600,
	width: 80,
	color: theme.palette.primary.main,
	backgroundColor: theme.palette.primary.hover,
}));

const StyledTableCell = styled(Table.Cell)(() => ({
	color: "text.secondary",
}));

const StyledButton = styled(Table.Cell)(() => ({
	borderLeft: 1,
	borderColor: "divider",
}));

const StyledInput = styled(Box)(() => ({
	display: "flex",
	gap: 1,
	alignItems: "center",
	marginTop: 8,
}));

export const Editmetamodel: React.FC<EditMetamodelProps> = ({
	open,
	onClose,
	initialName = "",
	initialType = "",
	initialDescription = "",
	initialLogicalNames = [],
	existingColumnNames = [],
	onSave,
	types,
	isEdit = true,
}) => {
	const typesList = useMemo(
		() =>
			types ?? [
				"int",
				"string",
				"float",
				"double",
				"varchar",
				"boolean",
				"date",
			],
		[types],
	);
	type LogicalNameItem = { id: string; name: string };
	const [singleNameVal, setSingleNameVal] = useState<string>(
		initialName ?? "",
	);
	const [typeVal, setTypeVal] = useState<string | null>(
		initialType ?? typesList[0],
	);
	const [activeTab, setActiveTab] = useState<number>(0);

	const [logicalNames, setLogicalNames] = useState<LogicalNameItem[]>([]);
	const [newLogicalName, setNewLogicalName] = useState<string>("");
	const [description, setDescription] = useState<string>(initialDescription);
	const [logicalNameError, setLogicalNameError] = useState<string>("");
	const [columnNameError, setColumnNameError] = useState<string>("");
	const baseId = useId();
	const idCounterRef = useRef(0);

	const openPrevRef = useRef<boolean>(false);

	useEffect(() => {
		if (open && !openPrevRef.current) {
			setTypeVal(initialType ?? typesList[0]);
			setSingleNameVal(initialName ?? "");

			const initialItems = (initialLogicalNames || [])
				.filter((name) => name && name.trim())
				.map((name) => {
					idCounterRef.current += 1;
					return {
						id: `${baseId}-${idCounterRef.current}`,
						name: name.trim(),
					};
				});
			setLogicalNames(initialItems);
			setDescription(initialDescription || "");
			setNewLogicalName("");
			setActiveTab(0);
			setLogicalNameError("");
			setColumnNameError("");
		}
		openPrevRef.current = open;
	}, [
		open,
		initialType,
		initialName,
		initialLogicalNames,
		initialDescription,
		typesList,
	]);

	const handleAddLogicalName = () => {
		const trimmed = (newLogicalName || "").trim();
		if (!trimmed) return;

		if (
			logicalNames.some(
				(item) => item.name.toLowerCase() === trimmed.toLowerCase(),
			)
		) {
			setLogicalNameError("Logical name already exists");
			return;
		}

		const id =
			crypto && typeof crypto.randomUUID === "function"
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

		setLogicalNames((prev) => [...prev, { id, name: trimmed }]);
		setNewLogicalName("");
		setLogicalNameError("");
	};

	const handleRemoveLogicalName = (id: string) => {
		setLogicalNames((prev) => prev.filter((it) => it.id !== id));
		setLogicalNameError("");
	};

	const handleColumnNameChange = (value: string) => {
		setSingleNameVal(value);

		const trimmedValue = value.trim();
		if (!trimmedValue) {
			setColumnNameError("");
			return;
		}

		const isDuplicate = existingColumnNames.some(
			(existingName) => existingName === trimmedValue.toLowerCase(),
		);

		if (isDuplicate) {
			setColumnNameError("The same name already exists");
		} else {
			setColumnNameError("");
		}
	};

	const handleSave = () => {
		const type = (typeVal ?? "").trim() || typesList[0];
		const name = (singleNameVal ?? "").trim();

		if (!name) return;

		// Check for duplicate before saving
		const isDuplicate = existingColumnNames.some(
			(existingName) => existingName === name.toLowerCase(),
		);

		if (isDuplicate) {
			setColumnNameError("The same name already exists");
			return;
		}

		const namesOnly: string[] = logicalNames.map((item) =>
			typeof item === "string" ? item : item.name,
		);

		(
			onSave as (payload: {
				name: string;
				type: string;
				logicalNames?: string[];
				description?: string;
			}) => void
		)({
			name,
			type,
			logicalNames: namesOnly,
			description: description?.trim() || undefined,
		});

		onClose();
	};

	const EditForm = (
		<StyledContainer>
			<FormControl fullWidth>
				<StyledLabel variant={"subtitle1"}>Column name</StyledLabel>
				<TextField
					variant="outlined"
					placeholder={"Edit column name"}
					value={singleNameVal}
					onChange={(e) => handleColumnNameChange(e.target.value)}
					fullWidth
					//error={!!columnNameError}
				/>
				{columnNameError && (
					<Typography
						variant="caption"
						color="error"
						sx={{
							display: "block",
							marginTop: 1,
						}}
					>
						{columnNameError}
					</Typography>
				)}
			</FormControl>

			<FormControl fullWidth>
				<StyledLabel variant={"subtitle1"}>Column Type</StyledLabel>
				<Autocomplete
					options={typesList}
					multiple={false}
					freeSolo
					value={typeVal}
					onChange={(_e, newValue: string | null) =>
						setTypeVal(newValue)
					}
					renderInput={(params) => (
						<TextField
							{...params}
							variant="outlined"
							placeholder="Select or type column type"
							inputProps={{ ...params.inputProps }}
						/>
					)}
				/>
			</FormControl>
		</StyledContainer>
	);

	return (
		<Modal
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			scroll="paper"
		>
			<ModalTitle>
				{isEdit ? `Edit ${initialName}` : "Add column"}
				<StyledCloseIconButton onClick={onClose} size="small">
					<Close fontSize="small" />
				</StyledCloseIconButton>
			</ModalTitle>

			{isEdit ? (
				<>
					<StyledTabsBox>
						<Tabs
							value={activeTab}
							onChange={(_, newValue) =>
								setActiveTab(Number(newValue))
							}
							indicatorColor="primary"
							textColor="primary"
							variant="scrollable"
						>
							<StyledTab label="Edit" value={0} />
							<StyledTab label="Description" value={1} />
							<StyledTab label="Logical Names" value={2} />
							<StyledTab
								label="Sample Instances"
								value={3}
								disabled
							/>
						</Tabs>
					</StyledTabsBox>
					<ModalContent>
						{activeTab === 0 && EditForm}
						{activeTab === 1 && (
							<StyledDescriptionBox>
								<FormControl fullWidth>
									<StyledLabel variant={"subtitle1"}>
										Description
									</StyledLabel>
									<TextArea
										variant="outlined"
										fullWidth
										minRows={3}
										maxRows={6}
										value={description}
										onChange={(e) =>
											setDescription(e.target.value)
										}
									/>
								</FormControl>
							</StyledDescriptionBox>
						)}
						{activeTab === 2 && (
							<StyledBox>
								<FormControl fullWidth>
									<TableContainer>
										<Table size="small" stickyHeader>
											<TableHeader>
												<Table.Row>
													<TableHeaderCell>
														Name
													</TableHeaderCell>
													<TableActions>
														Action
													</TableActions>
												</Table.Row>
											</TableHeader>
											<Table.Body>
												{logicalNames.length === 0 ? (
													<Table.Row>
														<StyledTableCell
															colSpan={2}
														>
															No logical names
															added.
														</StyledTableCell>
													</Table.Row>
												) : (
													logicalNames.map((item) => (
														<Table.Row
															key={item.id}
															data-testid={`engineMetadata-logicalname-${item.id}-btn`}
														>
															<Table.Cell>
																{item.name}
															</Table.Cell>
															<StyledButton>
																<IconButton
																	size="small"
																	onClick={() =>
																		handleRemoveLogicalName(
																			item.id,
																		)
																	}
																	data-testid={`engineMetadata-logicalname-${item.id}-remove`}
																>
																	<Delete fontSize="small" />
																</IconButton>
															</StyledButton>
														</Table.Row>
													))
												)}
											</Table.Body>
										</Table>
									</TableContainer>

									<StyledInput>
										<TextField
											variant="outlined"
											placeholder="Add logical name"
											value={newLogicalName}
											onChange={(e) => {
												setNewLogicalName(
													e.target.value,
												);
												if (logicalNameError)
													setLogicalNameError("");
											}}
											fullWidth
										/>
										<IconButton
											color="primary"
											onClick={handleAddLogicalName}
											disabled={!newLogicalName.trim()}
											data-testid="engineMetadata-logicalname-add"
										>
											<Add />
										</IconButton>
									</StyledInput>

									{logicalNameError && (
										<Typography
											variant="caption"
											color="error"
											sx={{
												display: "block",
												marginTop: 1,
											}}
										>
											{logicalNameError}
										</Typography>
									)}
								</FormControl>
							</StyledBox>
						)}
						{activeTab === 3 && (
							<Box>Sample Instances feature comes here!</Box>
						)}
					</ModalContent>
				</>
			) : (
				<Modal.Content>{EditForm}</Modal.Content>
			)}

			<ModalActions>
				<Button
					onClick={onClose}
					variant="outlined"
					data-testid="engineMetadata-cancel-btn"
				>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					variant="contained"
					color="primary"
					disabled={!singleNameVal.trim() || !!columnNameError}
					data-testid="engineMetadata-save-btn"
				>
					Save
				</Button>
			</ModalActions>
		</Modal>
	);
};
