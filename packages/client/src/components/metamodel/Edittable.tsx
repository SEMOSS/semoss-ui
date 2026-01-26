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
	Typography,
} from "@semoss/ui";
import type { ColumnOption } from "../import/database/MetamodelTypes";

const StyledBox = styled(Box)(() => ({
	p: 2,
}));

const StyledTabs = styled(Box)(() => ({
	borderBottom: 1,
	borderColor: "divider",
	marginLeft: "24px",
}));

const StyledTab = styled(Tab)(() => ({
	padding: "12px 16px",
}));

const StyledCloseIconButton = styled(IconButton)({
	position: "absolute",
	right: "8px",
	top: "15px",
});
const ModalTitle = styled(Modal.Title)({ padding: "8px 24px" });
const ModalContent = styled(Modal.Content)({ padding: "18px 24px" });
const ModalActions = styled(Modal.Actions)({ padding: "8px 18px" });

const StyledLabel = styled(Typography)(() => ({
	marginBottom: 2,
	display: "block",
	fontSize: 13,
}));

const StyledContainer = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	gap: 2,
}));

interface NodeShape {
	id: string;
	data: {
		name: string;
		description?: string;
		properties?: {
			id: string;
			name: string;
			type?: string;
			isSelected?: boolean;
		}[];
	};
}

interface Option {
	id?: string;
	name: string;
	label: string;
}

interface EditTableProps {
	open: boolean;
	onClose: () => void;

	node?: NodeShape | null;
	columnOptions?: ColumnOption[];

	initialAlias?: string;
	onSave: (payload: {
		nodeId: string;
		names: string[];
		description?: string;
		alias?: string;
	}) => void;
}

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
	const [selectedNames, setSelectedNames] = useState<Option[]>([]);

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

		const props = (node?.data?.properties || []).map((p) => ({
			...p,
			isSelected: true,
		}));
		setAliasVal(node?.data?.name ?? "");
		setDescriptionVal(node?.data?.description ?? "");

		if (node && node.data) {
			node.data = {
				...node.data,
				properties: props,
			};
		}

		const available = columnOptions ?? [];

		const availableKeys = new Set(
			available.map((c) => c.id ?? c.name).filter(Boolean),
		);
		const existing: Option[] = props
			.filter((p) => {
				if (!p?.isSelected) return false;
				const key = p.id ?? p.name;
				return availableKeys.has(key);
			})
			.map((p) => {
				const match = available.find(
					(c) => c.id === p.id || c.name === p.name,
				);
				return {
					id: p.id,
					name: match?.name ?? p.name,
					label: match?.name ?? p.name,
				};
			});
		setSelectedNames(existing);
	}, [open, node, columnOptions]);

	useEffect(() => {
		if (open) setTabIndex(0);
	}, [open]);

	const handleSave = () => {
		if (!nodeId) return;

		const cleaned = Array.from(
			new Set(
				(selectedNames || [])
					.map((s) =>
						typeof s === "string" ? s : s.name || s.label || "",
					)
					.map((v) => v.trim())
					.filter((v) => v.length > 0),
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

	const safeOptions: Option[] = useMemo(() => {
		return (columnOptions ?? []).map((opt) => ({
			id: opt.id,
			label: opt.name,
			name: opt.name,
		}));
	}, [columnOptions]);

	const toOptionObject = (v) => {
		if (!v && v !== "") return null;
		if (typeof v === "string") return { id: undefined, name: v, label: v };
		return {
			id: v.id,
			name: v.name ?? v.label ?? String(v),
			label: v.label ?? v.name ?? String(v),
		};
	};

	const isOptionEqualToValue = (option, value) => {
		if (!option || !value) return false;
		if (option.id && value.id) return option.id === value.id;
		return (option.name ?? option.label) === (value.name ?? value.label);
	};

	const handleChange = (
		_e: React.SyntheticEvent,
		newValue: (string | Option)[],
	) => {
		const flattened = Array.isArray(newValue)
			? newValue.flatMap((v) => (Array.isArray(v) ? v : [v]))
			: [];
		const normalized = flattened.map((v) => toOptionObject(v));
		const seen = new Map<string, Option>();
		for (const item of normalized) {
			const key = item.id ?? item.name;
			if (!seen.has(key)) seen.set(key, item);
		}
		const deduped = Array.from(seen.values());
		setSelectedNames(deduped);
		if (node && node.data) {
			const props = node.data.properties || [];
			const updatedProps = props.map((p) => {
				const match = deduped.find(
					(sel) => sel.id === p.id || sel.name === p.name,
				);
				return {
					...p,
					isSelected: !!match,
				};
			});
			node.data = {
				...node.data,
				properties: updatedProps,
			};
		}
	};
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
					data-testid="edit-table-close-modal"
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
					<StyledTab label="Edit Columns" />
					<StyledTab label="Settings" />
				</Tabs>
			</StyledTabs>

			<ModalContent>
				<TabPanel value={tabIndex} index={0}>
					<StyledContainer>
						<FormControl fullWidth>
							<StyledLabel variant="subtitle1">Table</StyledLabel>
							<TextField
								fullWidth
								variant="outlined"
								value={nodeName}
								disabled
							/>
						</FormControl>

						<FormControl fullWidth>
							<StyledLabel variant="subtitle1">
								Add or Remove Columns
							</StyledLabel>

							<Autocomplete
								options={safeOptions}
								multiple
								freeSolo
								value={selectedNames.map((v) =>
									toOptionObject(v),
								)}
								getOptionLabel={(opt) =>
									typeof opt === "string" ? opt : opt.label
								}
								isOptionEqualToValue={isOptionEqualToValue}
								onChange={handleChange}
								renderInput={(params) => (
									<TextField
										{...params}
										variant="outlined"
										placeholder="Type or pick column names"
									/>
								)}
							/>
						</FormControl>
					</StyledContainer>
				</TabPanel>

				<TabPanel value={tabIndex} index={1}>
					<FormControl fullWidth>
						<StyledLabel variant="subtitle1">
							Table Alias
						</StyledLabel>
						<TextField
							variant="outlined"
							fullWidth
							value={aliasVal}
							onChange={(e) => setAliasVal(e.target.value)}
							placeholder="Alias or display name for the table"
						/>
					</FormControl>

					<FormControl fullWidth>
						<StyledLabel variant="subtitle1">
							Description
						</StyledLabel>
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
			</ModalContent>

			<ModalActions>
				<Button onClick={onClose} data-testid="edit-table-cancel">
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					data-testid="edit-table-save"
				>
					Save
				</Button>
			</ModalActions>
		</Modal>
	);
};

export default EditTable;
