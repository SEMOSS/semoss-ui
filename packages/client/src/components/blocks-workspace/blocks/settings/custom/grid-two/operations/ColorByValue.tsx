import { Pencil, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import {
	type Block,
	type ColorRule,
	type GridBlockDef,
	type Paths,
	useFrame,
} from "@semoss/renderer";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { ColorPickerWithSwatch } from "../../../../settings/shared/ColorPickerWithSwatch";

export interface ColorByValueProps {
	id: string;
	path: Paths<Block<GridBlockDef>["data"], 4>;
}

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

// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
export const ColorByValue = observer<ColorByValueProps>(({ id, path }) => {
	const { data, setData } = useBlockSettings<GridBlockDef>(id);

	const [rules, setRules] = useState<ColorRule[]>([]);
	const [mode, setMode] = useState<"add" | "edit" | "null">(null);
	const [editingRule, setEditingRule] = useState<ColorRule | null>(null);
	const frame = useFrame(data.frame.name);

	useEffect(() => {
		const existingRules = data.option?.colorByValue || [];
		setRules(existingRules);
	}, [data.option]);
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

	const handleToggleColorEntireRow = (checked: boolean) => {
		updateFields("colorEntireRow", checked);
	};

	const renderEditForm = () => {
		const columnOptions = data.columns?.map((c) => c.name) ?? [];
		const newColumn = data.columns?.map((c) => ({
			field: c.name,
		}));

		const rows = frame.data.values.map((r, idx) => {
			const obj: Record<string, unknown> = { id: idx };
			newColumn.forEach((c, cIdx) => {
				obj[c.field] = r[cIdx];
			});
			return obj;
		});

		const getValues = (): string[] => {
			if (editingRule) {
				return rows.map((item) =>
					String(item[editingRule.column] ?? ""),
				);
			}
			return [];
		};

		return (
			<div className="flex flex-col gap-2 px-4">
				<p className="text-sm">
					{mode === "edit" ? "Edit Rule" : "Add Rule"}
				</p>
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Column to Color
						</p>
					</label>
					<Select
						value={editingRule?.column ?? ""}
						onValueChange={(newValue) => {
							updateFields("column", newValue);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select column" />
						</SelectTrigger>
						<SelectContent>
							{columnOptions.map((col) => (
								<SelectItem key={col} value={col}>
									{col}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Color
						</p>
					</label>
					<ColorPickerWithSwatch
						value={editingRule?.color}
						onChange={(color) => updateFields("color", color)}
					/>
				</div>
				<div
					className="flex flex-row items-center gap-2 py-2"
					style={{ marginTop: "8px" }}
				>
					<Switch
						checked={editingRule?.colorEntireRow}
						onCheckedChange={handleToggleColorEntireRow}
					/>
					<p className="text-muted-foreground text-sm">
						Color Entire Row
					</p>
				</div>
				{/* Select Column of Values */}
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Column of Values
						</p>
					</label>
					<Select
						value={editingRule?.valueColumn ?? ""}
						onValueChange={(newValue) => {
							updateFields("valueColumn", newValue);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select of values" />
						</SelectTrigger>
						<SelectContent>
							{columnOptions.map((col) => (
								<SelectItem key={col} value={col}>
									{col}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Comparator */}
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Comparator
						</p>
					</label>
					<Select
						value={editingRule?.comparator ?? ""}
						onValueChange={(newValue) => {
							updateFields("comparator", newValue);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select comparators" />
						</SelectTrigger>
						<SelectContent>
							{columnComparision.map((c) => (
								<SelectItem key={c.value} value={c.value}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Select Values */}
				<div className="flex flex-col justify-center gap-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label>
						<p className="text-muted-foreground text-sm">
							Select Value
						</p>
					</label>
					<Select
						value={editingRule?.value ?? ""}
						onValueChange={(newValue) => {
							updateFields("value", newValue);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select value" />
						</SelectTrigger>
						<SelectContent>
							{getValues().map((val) => (
								<SelectItem key={val} value={val}>
									{val}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Button container */}
				<div className="flex justify-end gap-4 py-2">
					<Button size="sm" variant="ghost" onClick={handleReset}>
						Reset
					</Button>
					<Button size="sm" onClick={handleSave}>
						Execute
					</Button>
				</div>
			</div>
		);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* List of the applied rule */}
			<div>
				{rules.length > 0 && (
					<table className="w-full text-sm">
						<thead>
							<tr>
								<th className="px-2 py-1 text-left">Column</th>
								<th className="px-2 py-1 text-left">
									Applied Rule
								</th>
								<th className="px-2 py-1 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							{rules.map((rule) => (
								<tr key={rule.id}>
									<td className="px-2 py-1">{rule.column}</td>
									<td className="px-2 py-1">
										{rule.column}
										{rule.comparator}
										{rule.value}
									</td>
									<td className="px-2 py-1">
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													handleEditRule(rule)
												}
											>
												<Pencil className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													handleDeleteRule(rule)
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			<div className="flex justify-center">
				<Button
					variant="outline"
					onClick={handleAddNewRule}
					className="px-[15%]"
				>
					+ Add New Rule
				</Button>
			</div>

			{editingRule && renderEditForm()}
		</div>
	);
});
