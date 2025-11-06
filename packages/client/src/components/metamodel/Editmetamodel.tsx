import { Add, Close, Delete } from "@mui/icons-material";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
}

const ModalTitle = styled(Modal.Title)({
	margin: 0,
	padding: "16px",
});
const StyledCloseIconButton = styled(IconButton)({
	position: "absolute",
	right: "8px",
	top: "15px",
});
const ModalActions = styled(Modal.Actions)({
	padding: "16px",
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
	margin: "24px",
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
}));

const TableCell = styled(Table.Cell)(() => ({
	fontWeight: 600,
	borderRight: 1,
	borderColor: "divider",
}));

const TableActions = styled(Table.Cell)(() => ({
	fontWeight: 600,
	width: 80,
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

const StyledTab = styled(Box)(() => ({
	padding: "16px",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	minHeight: 120,
}));

export const Editmetamodel: React.FC<EditMetamodelProps> = ({
	open,
	onClose,
	initialName = "",
	initialType = "",
	onSave,
	types,
	isEdit = true,
}) => {
	const typesList = useMemo(
		() => types ?? ["int", "float", "double", "varchar", "boolean", "date"],
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
	const [description, setDescription] = useState<string>("");

	const openPrevRef = useRef<boolean>(false);

	useEffect(() => {
		if (open && !openPrevRef.current) {
			setTypeVal(initialType ?? typesList[0]);
			setSingleNameVal(initialName ?? "");
			setLogicalNames([]);
			setDescription("");
			setNewLogicalName("");
			setActiveTab(0);
		}
		openPrevRef.current = open;
	}, [open]);

	const handleAddLogicalName = () => {
		const trimmed = (newLogicalName || "").trim();
		if (!trimmed) return;

		if (logicalNames.some((item) => item.name === trimmed)) {
			setNewLogicalName("");
			return;
		}

		const id =
			crypto && typeof crypto.randomUUID === "function"
				? crypto.randomUUID()
				: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

		setLogicalNames((prev) => [...prev, { id, name: trimmed }]);
		setNewLogicalName("");
	};

	const handleRemoveLogicalName = (id: string) => {
		setLogicalNames((prev) => prev.filter((it) => it.id !== id));
	};

	const handleSave = () => {
		const type = (typeVal ?? "").trim() || typesList[0];
		const name = (singleNameVal ?? "").trim();
		if (!name) return;

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
					onChange={(e) => setSingleNameVal(e.target.value)}
					fullWidth
				/>
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
			maxWidth="md"
			scroll="paper"
		>
			<ModalTitle>
				{isEdit ? `Edit ${singleNameVal}` : "Add column"}
				<StyledCloseIconButton
					onClick={onClose}
					aria-label="close"
					size="small"
				>
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
							variant="fullWidth"
						>
							<Tab label="Edit" value={0} />
							<Tab label="Description" value={1} />
							<Tab label="Logical Names" value={2} />
							<Tab label="Sample Instances" value={3} disabled />
						</Tabs>
					</StyledTabsBox>
					<Modal.Content>
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
									<StyledLabel variant={"subtitle1"}>
										Current Logical Name(s):
									</StyledLabel>

									<TableContainer>
										<Table
											size="small"
											aria-label="logical names table"
										>
											<Table.Head>
												<Table.Row>
													<TableCell>Name</TableCell>
													<TableActions>
														Action
													</TableActions>
												</Table.Row>
											</Table.Head>
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
													logicalNames.map(
														(item, idx) => (
															<Table.Row
																key={item.id}
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
																	>
																		<Delete fontSize="small" />
																	</IconButton>
																</StyledButton>
															</Table.Row>
														),
													)
												)}
											</Table.Body>
										</Table>
									</TableContainer>

									<StyledInput>
										<TextField
											variant="outlined"
											placeholder="Enter new logical name"
											value={newLogicalName ?? ""}
											onChange={(e) =>
												setNewLogicalName(
													e.target.value,
												)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddLogicalName();
												}
											}}
											fullWidth
										/>
										<IconButton
											size="small"
											onClick={handleAddLogicalName}
											aria-label="add-logical-name"
										>
											<Add fontSize="small" />
										</IconButton>
									</StyledInput>
								</FormControl>
							</StyledBox>
						)}
						{activeTab === 3 && (
							<StyledTab>
								Sample Instances feature comes here!
							</StyledTab>
						)}
					</Modal.Content>
				</>
			) : (
				<Modal.Content>{EditForm}</Modal.Content>
			)}

			<ModalActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button variant="contained" onClick={handleSave}>
					Save
				</Button>
			</ModalActions>
		</Modal>
	);
};

export default Editmetamodel;
