import { Input, Select } from "@/components/ui";
import { ColorPicker } from "../shared/ColorPicker";
import { ResetButton } from "../shared/ResetButton";

interface KpiSettingsProps {
	value?: {
		backgroundColor?: string;
		fontFamily?: string;
		fontSize?: number;
		fontColor?: string;
		textAlign?: "left" | "center" | "right";
		layout?: "horizontal" | "vertical" | "grid";
	};
	onChange: (value: {
		backgroundColor?: string;
		fontFamily?: string;
		fontSize?: number;
		fontColor?: string;
		textAlign?: "left" | "center" | "right";
		layout?: "horizontal" | "vertical" | "grid";
	}) => void;
	onReset: () => void;
}

export function KpiSettings({ value, onChange, onReset }: KpiSettingsProps) {
	const currentValue = value || {
		backgroundColor: "transparent",
		fontFamily: "inherit",
		fontSize: 36,
		fontColor: "#0f172a",
		textAlign: "left" as const,
		layout: "horizontal" as const,
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
					Card Layout
				</label>
				<Select
					value={currentValue.layout || "horizontal"}
					onChange={(e) =>
						updateField(
							"layout",
							e.target.value as
								| "horizontal"
								| "vertical"
								| "grid",
						)
					}
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					<option value="horizontal">Horizontal (wrap row)</option>
					<option value="vertical">Vertical (stack column)</option>
					<option value="grid">Grid (auto-fit tiles)</option>
				</Select>
				<p className="mt-1 text-[11px] text-stone-400">
					How multiple KPI cards are arranged. Has no visible effect
					when only one metric is configured.
				</p>
			</div>

			<ColorPicker
				label="Background Color"
				value={currentValue.backgroundColor || "#ffffff"}
				onChange={(color) => updateField("backgroundColor", color)}
				defaultColor="transparent"
			/>

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

			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Font Size (px)
				</label>
				<Input
					type="number"
					min="14"
					max="72"
					value={currentValue.fontSize ?? 36}
					onChange={(e) =>
						updateField("fontSize", parseInt(e.target.value) || 36)
					}
					placeholder="36"
					className="w-full rounded border border-stone-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				/>
			</div>

			<ColorPicker
				label="Font Color"
				value={currentValue.fontColor || "#0f172a"}
				onChange={(color) => updateField("fontColor", color)}
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

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
