import { useId } from "react";
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
		showRowInfo?: boolean;
	};
	onChange: (value: {
		backgroundColor?: string;
		fontFamily?: string;
		fontSize?: number;
		fontColor?: string;
		textAlign?: "left" | "center" | "right";
		layout?: "horizontal" | "vertical" | "grid";
		showRowInfo?: boolean;
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

	const layoutId = useId();
	const fontFamilyId = useId();
	const fontSizeId = useId();
	const textAlignId = useId();

	return (
		<div className="space-y-4">
			<div>
				<label
					htmlFor={layoutId}
					className="mb-1.5 block font-semibold text-stone-600 text-xs"
				>
					Card Layout
				</label>
				<Select
					id={layoutId}
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
				<label
					htmlFor={fontFamilyId}
					className="mb-1.5 block font-semibold text-stone-600 text-xs"
				>
					Font Family
				</label>
				<Select
					id={fontFamilyId}
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
				<label
					htmlFor={fontSizeId}
					className="mb-1.5 block font-semibold text-stone-600 text-xs"
				>
					Font Size (px)
				</label>
				<Input
					id={fontSizeId}
					type="number"
					min="14"
					max="72"
					value={currentValue.fontSize ?? 36}
					onChange={(e) =>
						updateField(
							"fontSize",
							parseInt(e.target.value, 10) || 36,
						)
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
				<label
					htmlFor={textAlignId}
					className="mb-1.5 block font-semibold text-stone-600 text-xs"
				>
					Text Alignment
				</label>
				<Select
					id={textAlignId}
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

			<div className="flex items-center justify-between">
				<span className="font-semibold text-stone-600 text-xs">
					Show Row Info
				</span>
				<button
					type="button"
					role="switch"
					aria-checked={currentValue.showRowInfo ?? false}
					onClick={() =>
						updateField(
							"showRowInfo",
							!(currentValue.showRowInfo ?? false),
						)
					}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
						(currentValue.showRowInfo ?? false)
							? "bg-indigo-500"
							: "bg-stone-200"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							(currentValue.showRowInfo ?? false)
								? "translate-x-4.5"
								: "translate-x-0.5"
						}`}
					/>
				</button>
			</div>
			<p className="-mt-2 text-[11px] text-stone-400">
				Shows "N rows · aggregation" below each KPI value when no trend
				is available.
			</p>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
