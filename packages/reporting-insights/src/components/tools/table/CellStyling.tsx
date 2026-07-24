import { Input } from "@/components/ui";
import type { ColumnStyling } from "@/types/dashboard";
import { ColorPicker } from "../shared/ColorPicker";
import { ColumnMultiSelect } from "../shared/ColumnMultiSelect";
import { ResetButton } from "../shared/ResetButton";

interface CellStylingProps {
	columns: string[];
	value?: ColumnStyling;
	onChange: (value: ColumnStyling) => void;
	onReset: () => void;
}

export function CellStyling({
	columns,
	value,
	onChange,
	onReset,
}: CellStylingProps) {
	const currentValue: ColumnStyling = value || {
		columns: [],
		fontSize: 12,
		color: "#334155",
		backgroundColor: "#ffffff",
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
					value={currentValue.fontSize || 12}
					onChange={(e) =>
						updateField("fontSize", parseInt(e.target.value) || 12)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<ColorPicker
				label="Font Color"
				value={currentValue.color || "#334155"}
				onChange={(color) => updateField("color", color)}
				defaultColor="#334155"
			/>

			<ColorPicker
				label="Background Color"
				value={currentValue.backgroundColor || "#ffffff"}
				onChange={(color) => updateField("backgroundColor", color)}
				defaultColor="#ffffff"
			/>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Text Alignment
				</label>
				<div className="inline-flex overflow-hidden rounded border border-stone-200">
					{(["left", "center", "right"] as const).map((align) => {
						const isActive =
							(currentValue.textAlign ?? "left") === align;
						return (
							<button
								key={align}
								type="button"
								onClick={() => updateField("textAlign", align)}
								className={`px-3 py-1.5 text-xs capitalize transition-colors ${
									isActive
										? "bg-indigo-500 text-white"
										: "bg-white text-stone-600 hover:bg-stone-50"
								} ${align !== "left" ? "border-stone-200 border-l" : ""}`}
								title={`Align ${align}`}
							>
								{align}
							</button>
						);
					})}
				</div>
			</div>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
