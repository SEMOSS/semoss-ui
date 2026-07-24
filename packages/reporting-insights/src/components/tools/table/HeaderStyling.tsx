import { Input } from "@/components/ui";
import type { ColumnStyling } from "@/types/dashboard";
import { ColorPicker } from "../shared/ColorPicker";
import { ColumnMultiSelect } from "../shared/ColumnMultiSelect";
import { ResetButton } from "../shared/ResetButton";

interface HeaderStylingProps {
	columns: string[];
	value?: ColumnStyling;
	onChange: (value: ColumnStyling) => void;
	onReset: () => void;
}

export function HeaderStyling({
	columns,
	value,
	onChange,
	onReset,
}: HeaderStylingProps) {
	const currentValue: ColumnStyling = value || {
		columns: [],
		fontSize: 11,
		color: "#64748b",
		backgroundColor: "#f8fafc",
	};

	const updateField = <K extends keyof ColumnStyling>(
		field: K,
		val: ColumnStyling[K],
	) => {
		onChange({ ...currentValue, [field]: val });
	};

	return (
		<div className="space-y-4">
			<ColumnMultiSelect
				label="Select Columns"
				columns={columns}
				selectedColumns={currentValue.columns}
				onChange={(selected) => updateField("columns", selected)}
			/>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Font Size (px)
				</label>
				<Input
					type="number"
					min="8"
					max="32"
					value={currentValue.fontSize || 11}
					onChange={(e) =>
						updateField("fontSize", parseInt(e.target.value) || 11)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<ColorPicker
				label="Font Color"
				value={currentValue.color || "#64748b"}
				onChange={(color) => updateField("color", color)}
				defaultColor="#64748b"
			/>

			<ColorPicker
				label="Background Color"
				value={currentValue.backgroundColor || "#f8fafc"}
				onChange={(color) => updateField("backgroundColor", color)}
				defaultColor="#f8fafc"
			/>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
