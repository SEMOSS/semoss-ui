import { Input, Select } from "@/components/ui";
import type { ValueLabelConfig } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface ValueLabelEditorProps {
	value?: ValueLabelConfig;
	onChange: (value: ValueLabelConfig) => void;
	onReset: () => void;
	/** Subset to expose. `'line'` includes alignment, `'pie'` hides it. */
	variant?: "line" | "pie";
}

const POSITION_OPTIONS_LINE: {
	value: NonNullable<ValueLabelConfig["position"]>;
	label: string;
}[] = [
	{ value: "top", label: "Top" },
	{ value: "bottom", label: "Bottom" },
	{ value: "inside", label: "Inside" },
	{ value: "outside", label: "Outside" },
	{ value: "center", label: "Center" },
];

const POSITION_OPTIONS_PIE: {
	value: NonNullable<ValueLabelConfig["position"]>;
	label: string;
}[] = [
	{ value: "inside", label: "Inside" },
	{ value: "outside", label: "Outside" },
];

const FONT_FAMILIES = [
	"Inter",
	"Arial",
	"Helvetica",
	"Georgia",
	"Times New Roman",
	"Courier New",
	"Monaco",
];
const FONT_WEIGHTS: {
	value: NonNullable<ValueLabelConfig["fontWeight"]>;
	label: string;
}[] = [
	{ value: "normal", label: "Normal" },
	{ value: "medium", label: "Medium" },
	{ value: "semibold", label: "Semibold" },
	{ value: "bold", label: "Bold" },
];

/**
 * Composite editor for a chart's value-label configuration. Used by Line
 * (full set) and Pie (subset — no alignment row).
 */
export function ValueLabelEditor({
	value,
	onChange,
	onReset,
	variant = "line",
}: ValueLabelEditorProps) {
	const cfg = value ?? {};
	const set = (updates: Partial<ValueLabelConfig>) =>
		onChange({ ...cfg, ...updates });
	const positionOptions =
		variant === "pie" ? POSITION_OPTIONS_PIE : POSITION_OPTIONS_LINE;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-stone-600 text-xs">
					Show value labels
				</span>
				<button
					type="button"
					onClick={() => set({ show: !(cfg.show === true) })}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
						cfg.show ? "bg-indigo-500" : "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							cfg.show
								? "translate-x-[18px]"
								: "translate-x-[2px]"
						}`}
					/>
				</button>
			</div>

			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Position
				</label>
				<Select
					value={
						cfg.position ?? (variant === "pie" ? "outside" : "top")
					}
					onChange={(e) =>
						set({
							position: e.target
								.value as ValueLabelConfig["position"],
						})
					}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{positionOptions.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>

			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Rotate (°)
				</label>
				<Input
					type="number"
					min={-90}
					max={90}
					value={cfg.rotate ?? 0}
					onChange={(e) => set({ rotate: Number(e.target.value) })}
					className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				/>
			</div>

			{variant !== "pie" && (
				<div>
					<label className="mb-1 block font-semibold text-stone-600 text-xs">
						Alignment
					</label>
					<div className="flex gap-1">
						{(["left", "center", "right"] as const).map((a) => (
							<button
								key={a}
								type="button"
								onClick={() => set({ align: a })}
								className={`flex-1 rounded px-2 py-1.5 font-medium text-xs transition-colors ${
									(cfg.align ?? "center") === a
										? "bg-indigo-500 text-white"
										: "bg-stone-100 text-stone-600 hover:bg-stone-200"
								}`}
							>
								{a.charAt(0).toUpperCase() + a.slice(1)}
							</button>
						))}
					</div>
				</div>
			)}

			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Font Family
				</label>
				<Select
					value={cfg.fontFamily ?? "Inter"}
					onChange={(e) => set({ fontFamily: e.target.value })}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{FONT_FAMILIES.map((f) => (
						<option key={f} value={f}>
							{f}
						</option>
					))}
				</Select>
			</div>

			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Font Size
				</label>
				<Input
					type="number"
					min={8}
					max={32}
					value={cfg.fontSize ?? 11}
					onChange={(e) => set({ fontSize: Number(e.target.value) })}
					className="w-full rounded border border-stone-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				/>
			</div>

			{variant !== "pie" && (
				<div>
					<label className="mb-1 block font-semibold text-stone-600 text-xs">
						Font Weight
					</label>
					<Select
						value={cfg.fontWeight ?? "normal"}
						onChange={(e) =>
							set({
								fontWeight: e.target
									.value as ValueLabelConfig["fontWeight"],
							})
						}
						className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
					>
						{FONT_WEIGHTS.map((w) => (
							<option key={w.value} value={w.value}>
								{w.label}
							</option>
						))}
					</Select>
				</div>
			)}

			<div>
				<label className="mb-1 block font-semibold text-stone-600 text-xs">
					Color
				</label>
				<div className="flex items-center gap-2">
					<input
						type="color"
						value={cfg.color ?? "#64748b"}
						onChange={(e) => set({ color: e.target.value })}
						className="h-9 w-9 cursor-pointer rounded-lg border border-stone-200 bg-white p-0.5"
					/>
					<span className="font-mono text-stone-500 text-xs">
						{cfg.color ?? "#64748b"}
					</span>
				</div>
			</div>

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
