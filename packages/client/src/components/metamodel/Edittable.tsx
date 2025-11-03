import { Close } from "@mui/icons-material";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
	Autocomplete,
	Box,
	Button,
	FormControl,
	IconButton,
	Modal,
	styled,
	Tab,
	Tabs,
	TextArea,
	TextField,
} from "@semoss/ui";

const StyledBox = styled(Box)(() => ({
	p: 2,
}));

const StyledTabs = styled(Box)(() => ({
	borderBottom: 1,
	borderColor: "divider",
}));

interface NodeShape {
	id: string;
	data: {
		name: string;
		description?: string;
		properties?: { id: string; name: string; type?: string }[];
	};
}

interface EditTableProps {
	open: boolean;
	onClose: () => void;

	node?: NodeShape | null;
	columnOptions?: string[];

	initialDescription?: string;
	initialAlias?: string;
	onSave: (payload: {
		nodeId: string;
		names: string[];
		description?: string;
		alias?: string;
	}) => void;
}

const ModalTitle = styled(Modal.Title)({ m: 0, p: 1 });
const StyledCloseIconButton = styled(IconButton)({
	position: "absolute",
	right: "8px",
	top: "15px",
});
const ModalActions = styled(Modal.Actions)({ p: 2 });

function TabPanel({
	children,
	value,
	index,
}: {
	children?: React.ReactNode;
	value: number;
	index: number;
}) {
	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			aria-labelledby={`tab-${index}`}
		>
			{value === index && <StyledBox>{children}</StyledBox>}
		</div>
	);
}

const EditTable: React.FC<EditTableProps> = ({
	open,
	onClose,
	node = null,
	columnOptions = [],
	onSave,
}) => {
	const [selectedNames, setSelectedNames] = useState<string[]>([]);

	const [tabIndex, setTabIndex] = useState<number>(0);

	const nodeId = node?.id ?? null;
	const nodeName = node?.data?.name ?? "";
	const nodeDescription = node?.data?.description ?? "";

	const [descriptionVal, setDescriptionVal] = useState<string>(
		nodeDescription ?? "",
	);
	const [aliasVal, setAliasVal] = useState<string>(nodeName ?? "");

	useEffect(() => {
		if (!open) return;
		const existing = (node?.data?.properties || []).map((p) => p.name);
		setSelectedNames(existing);

		setAliasVal(node?.data?.name ?? "");
		setDescriptionVal(node?.data?.description ?? "");
	}, [open, node]);

	useEffect(() => {
		if (!open) return;
		const existing = (node?.data?.properties || []).map((p) => p.name);
		setSelectedNames(existing);
	}, [open, node]);

	useEffect(() => {
		if (open) setTabIndex(0);
	}, [open]);

	const handleSave = () => {
		if (!nodeId) return;

		const cleaned = Array.from(
			new Set(
				(selectedNames || [])
					.map((s) => (s || "").trim())
					.filter(Boolean),
			),
		);

		onSave({
			nodeId,
			names: cleaned,
			description: descriptionVal?.trim() || undefined,
			alias: aliasVal?.trim() || undefined,
		});

		onClose();
	};

	const safeOptions = useMemo(() => columnOptions || [], [columnOptions]);

	return (
		<Modal
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			scroll="paper"
		>
			<ModalTitle>
				Edit {nodeName || "Table"}
				<StyledCloseIconButton
					onClick={onClose}
					aria-label="close"
					size="small"
				>
					<Close fontSize="small" />
				</StyledCloseIconButton>
			</ModalTitle>

			<StyledTabs>
				<Tabs
					value={tabIndex}
					onChange={(_e, v) => setTabIndex(v)}
					aria-label="edit-table-tabs"
				>
					<Tab label="Edit Columns" />
					<Tab label="Settings" />
				</Tabs>
			</StyledTabs>

			<Modal.Content>
				<TabPanel value={tabIndex} index={0}>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 16,
						}}
					>
						<FormControl fullWidth>
							<span
								style={{
									marginBottom: 6,
									display: "block",
									fontSize: 13,
								}}
							>
								Table
							</span>
							<TextField
								fullWidth
								variant="outlined"
								value={nodeName}
								disabled
							/>
						</FormControl>

						<FormControl fullWidth>
							<span
								style={{
									marginBottom: 6,
									display: "block",
									fontSize: 13,
								}}
							>
								Add or Remove Columns
							</span>

							<Autocomplete
								options={safeOptions}
								multiple
								freeSolo
								value={selectedNames}
								onChange={(
									_e,
									newValue: (string | string[])[],
								) => {
									const flattened = Array.isArray(newValue)
										? newValue.flatMap((v) =>
												Array.isArray(v) ? v : [v],
											)
										: [];
									setSelectedNames(
										flattened.map((v) =>
											(v || "").toString(),
										),
									);
								}}
								renderInput={(params) => (
									<TextField
										{...params}
										variant="outlined"
										placeholder="Type or pick column names"
										inputProps={{ ...params.inputProps }}
									/>
								)}
							/>
						</FormControl>
					</div>
				</TabPanel>

				<TabPanel value={tabIndex} index={1}>
					<FormControl fullWidth>
						<span
							style={{
								fontSize: 13,
								marginBottom: 6,
								display: "block",
							}}
						>
							Table Alias
						</span>
						<TextField
							variant="outlined"
							fullWidth
							value={aliasVal}
							onChange={(e) => setAliasVal(e.target.value)}
							placeholder="Alias or display name for the table"
						/>
					</FormControl>

					<FormControl fullWidth>
						<span
							style={{
								fontSize: 13,
								marginBottom: 6,
								display: "block",
							}}
						>
							Description
						</span>
						<TextArea
							variant="outlined"
							fullWidth
							minRows={3}
							maxRows={6}
							value={descriptionVal}
							onChange={(e) => setDescriptionVal(e.target.value)}
						/>
					</FormControl>
				</TabPanel>
			</Modal.Content>

			<ModalActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button variant="contained" onClick={handleSave}>
					Save
				</Button>
			</ModalActions>
		</Modal>
	);
};

export default EditTable;
