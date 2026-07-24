import { Input, Select } from "@/components/ui";
import { ColorPicker } from "./ColorPicker";
import { ResetButton } from "./ResetButton";

interface ChartTitleProps {
	visualizationType?: string;
	value?: {
		text: string;
		fontSize: number;
		color: string;
		textAlign?: "left" | "center" | "right";
		fontWeight?: "normal" | "medium" | "semibold" | "bold";
		fontFamily?: string;
	};
	onChange: (value: {
		text: string;
		fontSize: number;
		color: string;
		textAlign?: "left" | "center" | "right";
		fontWeight?: "normal" | "medium" | "semibold" | "bold";
		fontFamily?: string;
	}) => void;
	onReset: () => void;
}

export function ChartTitle({
	visualizationType,
	value,
	onChange,
	onReset,
}: ChartTitleProps) {
	const currentValue = value || {
		text: "",
		fontSize: visualizationType === "kpi" ? 11 : 18,
		color: visualizationType === "kpi" ? "#64748b" : "#0f172a",
		textAlign: "left" as const,
		fontWeight: visualizationType === "kpi" ? "semibold" : "bold",
		fontFamily: "inherit",
	};

	const updateField = <K extends keyof typeof currentValue>(
		field: K,
		val: (typeof currentValue)[K],
	) => {
		onChange({ ...currentValue, [field]: val });
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					{visualizationType === "kpi"
						? "Title Text (per card)"
						: "Title Text"}
				</label>
				<Input
					type="text"
					value={currentValue.text}
					onChange={(e) => updateField("text", e.target.value)}
					placeholder="Enter chart title..."
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Font Size (px)
				</label>
				<Input
					type="number"
					min="10"
					max="48"
					value={currentValue.fontSize}
					onChange={(e) =>
						updateField("fontSize", parseInt(e.target.value) || 18)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<ColorPicker
				label="Font Color"
				value={currentValue.color}
				onChange={(color) => updateField("color", color)}
				defaultColor="#0f172a"
			/>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Text Alignment
				</label>
				<Select
					value={currentValue.textAlign || "left"}
					onChange={(e) =>
						updateField(
							"textAlign",
							e.target.value as "left" | "center" | "right",
						)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					<option value="left">Left</option>
					<option value="center">Center</option>
					<option value="right">Right</option>
				</Select>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Font Weight
				</label>
				<Select
					value={currentValue.fontWeight || "bold"}
					onChange={(e) =>
						updateField(
							"fontWeight",
							e.target.value as
								| "normal"
								| "medium"
								| "semibold"
								| "bold",
						)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					<option value="normal">Normal (400)</option>
					<option value="medium">Medium (500)</option>
					<option value="semibold">Semibold (600)</option>
					<option value="bold">Bold (700)</option>
				</Select>
			</div>

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Font Family
				</label>
				<Select
					value={currentValue.fontFamily || "inherit"}
					onChange={(e) => updateField("fontFamily", e.target.value)}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					<option value="inherit">Default (Inherit)</option>
					<option value="ui-sans-serif, system-ui, sans-serif">
						Sans Serif
					</option>
					<option value="ui-serif, Georgia, serif">Serif</option>
					<option value="ui-monospace, monospace">Monospace</option>
					<option value="Arial, sans-serif">Arial</option>
					<option value="'Times New Roman', serif">
						Times New Roman
					</option>
					<option value="'Courier New', monospace">
						Courier New
					</option>
					<option value="Verdana, sans-serif">Verdana</option>
					<option value="Georgia, serif">Georgia</option>
					<option value="'Trebuchet MS', sans-serif">
						Trebuchet MS
					</option>
				</Select>
			</div>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
