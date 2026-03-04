import { Delete, Edit } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useState } from "react";
import {
	type Block,
	BlockDef,
	ChartTitleSettings,
	type ColorRule,
	GridBlockColumn,
	type GridBlockDef,
	type Paths,
	PathValue,
	useFrame,
} from "@semoss/renderer";
import {
	Autocomplete,
	Button,
	IconButton,
	Switch,
	styled,
	Table,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { ColorPickerWithSwatch } from "../../../../settings/shared/ColorPickerWithSwatch";

export interface ColorByValueProps {
	id: string;
	path: Paths<Block<GridBlockDef>["data"], 4>;
}

const StyledButtonWrapper = styled("div")(({ theme }) => ({
	display: "flex",
	justifyContent: "flex-end",
	gap: "16px",
	paddingBlock: "8px",
}));

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
	padding: "0px 16px",
}));

const StyledTableContainer = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(2),
}));

const Styledbutton = styled(Button)(({ theme }) => ({
	paddingInline: "15%",
}));

const StyledFieldWrapper = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	gap: "8px",
}));

const StyledAxisDiv = styled("div")<{
	display?: string;
	justifyContent?: string;
	gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
	padding: "8px 0",
	alignItems: "center",
	gap: gap ?? undefined,
}));

const columnComparision = [
	{
		name: "is Equal To",
		value: "==",
	},
	{
		name: "is Not Equal To",
		value: "!=",
	},
	{
		name: "is Less than",
		value: "<",
	},
	{
		name: "is greater than",
		value: ">",
	},
	{
		name: "is Lesser than or Equal to",
		value: "<=",
	},
	{
		name: "is greater than or Equal to",
		value: ">=",
	},
];

const INITIAL_RULE: ColorRule = {
	id: "",
	column: "",
	comparator: "==",
	value: "",
	valueColumn: "",
	color: "#000000",
	colorEntireRow: false,
};

export const ColorByValue = observer<ColorByValueProps>(({ id, path }) => {
	const { data, setData } = useBlockSettings<GridBlockDef>(id);

	const [rules, setRules] = useState<ColorRule[]>([]);
	const [mode, setMode] = useState<"add" | "edit" | "null">(null);

	// local state to manage form data for add and edit rules
	const [editingRule, setEditingRule] = useState<ColorRule | null>(null);

	// get the frame
	const frame = useFrame(data.frame.name);

	useEffect(() => {
		const existingRules = data.option?.colorByValue || [];
		setRules(existingRules);
	}, [data.option]);

	// Handlers for adding and editing rules
	const handleAddNewRule = () => {
		setMode("add");
		setEditingRule(INITIAL_RULE);
	};

	const handleEditRule = (rule: ColorRule) => {
		setMode("edit");
		setEditingRule(rule);
	};

	const handleDeleteRule = (ruleToDelete: ColorRule) => {
		const updatedRules = rules.filter((r) => r.id !== ruleToDelete.id);
		setRules(updatedRules);
		setData("option", { ...data.option, colorByValue: updatedRules });
	};

	const updateFields = <K extends keyof ColorRule>(
		field: K,
		value: ColorRule[K],
	) => {
		setEditingRule((prevRule) => ({
			...prevRule,
			[field]: value,
		}));
	};

	const handleReset = () => {
		if (!editingRule) return;
		setEditingRule(INITIAL_RULE);
	};

	const handleSave = () => {
		if (
			!editingRule ||
			!editingRule.column ||
			!editingRule.value ||
			!editingRule.valueColumn
		)
			return;

		let updated: ColorRule[];

		if (mode === "add") {
			const newRule: ColorRule = {
				...editingRule,
				id: Date.now().toString(),
			};
			updated = [...rules, newRule];
			handleReset();
		} else {
			updated = rules.map((r) =>
				r.id === editingRule.id ? editingRule : r,
			);
		}

		setRules(updated);
		setData("option", { ...data.option, colorByValue: updated });
		setEditingRule(null);
	};

	const handleToggleColorEntireRow = (e: ChangeEvent<HTMLInputElement>) => {
		const checked = e.target.checked;
		updateFields("colorEntireRow", checked);
	};

	const renderEditForm = () => {
		const columnOptions = data.columns?.map((c) => c.name) ?? [];
		const newColumn = data.columns?.map((c) => ({
			field: c.name,
		}));

		const rows = frame.data.values.map((r, idx) => {
			const obj: Record<string, any> = { id: idx };
			newColumn.forEach((c, cIdx) => {
				obj[c.field] = r[cIdx];
			});
			return obj;
		});

		const getValues = () => {
			const values = [];
			if (editingRule) {
				const values = rows.map((item) => item[editingRule.column]);
				return values;
			} else {
				return [];
			}
		};

		return (
			<StyledContainer>
				<Typography variant="body1">
					{mode === "edit" ? "Edit Rule" : "Add Rule"}
				</Typography>
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Column to Color
						</Typography>{" "}
					</label>
					<Autocomplete
						fullWidth
						size="small"
						multiple={false}
						value={editingRule?.column}
						onChange={(_, newValue) => {
							updateFields("column", newValue || "");
						}}
						options={columnOptions}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Select column"
							/>
						)}
					/>
				</StyledFieldWrapper>
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Color
						</Typography>{" "}
					</label>

					<ColorPickerWithSwatch
						value={editingRule?.color}
						onChange={(color) => updateFields("color", color)}
					/>
				</StyledFieldWrapper>
				<StyledAxisDiv
					display="flex"
					gap="8px"
					style={{ marginTop: "8px" }}
				>
					<Switch
						size="small"
						checked={editingRule?.colorEntireRow}
						onChange={handleToggleColorEntireRow}
					/>
					<Typography variant="body2" color="secondary">
						Color Entire Row
					</Typography>
				</StyledAxisDiv>
				{/* Select Column of Values  */}
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Column of Values
						</Typography>{" "}
					</label>
					<Autocomplete
						fullWidth
						size="small"
						multiple={false}
						value={editingRule?.valueColumn}
						onChange={(_, newValue) => {
							updateFields("valueColumn", newValue || "");
						}}
						options={columnOptions}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Select of values"
							/>
						)}
					/>
				</StyledFieldWrapper>

				{/* Comparator  */}
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Comparator
						</Typography>{" "}
					</label>
					<Autocomplete
						fullWidth
						size="small"
						multiple={false}
						value={
							columnComparision.find(
								(c) => c.value === editingRule?.comparator,
							) ?? null
						}
						onChange={(_, newValue) => {
							updateFields(
								"comparator",
								typeof newValue === "object" &&
									newValue !== null
									? newValue.value
									: "",
							);
						}}
						options={columnComparision}
						getOptionLabel={(option) =>
							typeof option === "string" ? option : option.name
						}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Select comparators"
							/>
						)}
					/>
				</StyledFieldWrapper>

				{/* Select Values  */}
				<StyledFieldWrapper>
					<label>
						<Typography variant="body2" color="secondary">
							Select Value
						</Typography>{" "}
					</label>
					<Autocomplete
						fullWidth
						size="small"
						multiple={false}
						value={editingRule?.value}
						onChange={(_, newValue) => {
							updateFields("value", newValue || "");
						}}
						options={getValues()}
						renderInput={(params) => (
							<TextField
								{...params}
								variant="outlined"
								size="small"
								placeholder="Select value"
							/>
						)}
					/>
				</StyledFieldWrapper>

				{/* Button container  */}
				<StyledButtonWrapper>
					<Button size="small" variant="text" onClick={handleReset}>
						Reset
					</Button>
					<Button
						size="small"
						variant="contained"
						onClick={handleSave}
					>
						Execute
					</Button>
				</StyledButtonWrapper>
			</StyledContainer>
		);
	};

	return (
		<StyledTableContainer>
			{/* List of the applied rule  */}
			<div>
				{rules.length > 0 && (
					<Table size="small">
						<Table.Head>
							<Table.Row>
								<Table.Cell>Column</Table.Cell>
								<Table.Cell>Applied Rule</Table.Cell>
								<Table.Cell>Action</Table.Cell>
							</Table.Row>
						</Table.Head>
						<Table.Body>
							{rules.map((rule) => (
								<Table.Row key={rule.id}>
									<Table.Cell>{rule.column}</Table.Cell>
									<Table.Cell>
										{rule.column}
										{rule.comparator}
										{rule.value}
									</Table.Cell>
									<Table.Cell>
										<div>
											<IconButton
												onClick={() =>
													handleEditRule(rule)
												}
											>
												<Edit />
											</IconButton>
											<IconButton
												onClick={() =>
													handleDeleteRule(rule)
												}
											>
												<Delete />
											</IconButton>
										</div>
									</Table.Cell>
								</Table.Row>
							))}
						</Table.Body>
					</Table>
				)}
			</div>
			<div style={{ display: "flex", justifyContent: "center" }}>
				<Styledbutton variant="outlined" onClick={handleAddNewRule}>
					+ Add New Rule
				</Styledbutton>
			</div>

			{editingRule && renderEditForm()}
		</StyledTableContainer>
	);
});
