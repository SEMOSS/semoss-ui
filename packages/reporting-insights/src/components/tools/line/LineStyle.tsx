import { Select } from "@/components/ui";
import type { CurveType, LineStyling } from "@/types/dashboard";
import { DEFAULT_LINE_STYLING } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface LineStyleProps {
	value?: Pick<LineStyling, "curveType" | "lineType" | "lineWidth">;
	onChange: (
		updates: Partial<
			Pick<LineStyling, "curveType" | "lineType" | "lineWidth">
		>,
	) => void;
	onReset: () => void;
}

const CURVE_OPTIONS: { value: CurveType; label: string }[] = [
	{ value: "exact", label: "Exact" },
	{ value: "smooth", label: "Smooth" },
	{ value: "stepStart", label: "Step (Start)" },
	{ value: "stepMiddle", label: "Step (Middle)" },
	{ value: "stepEnd", label: "Step (End)" },
];

const LINE_TYPE_OPTIONS: {
	value: NonNullable<LineStyling["lineType"]>;
	label: string;
}[] = [
	{ value: "solid", label: "Solid" },
	{ value: "dashed", label: "Dashed" },
	{ value: "dotted", label: "Dotted" },
];

/** Composite editor for line curve type, dash pattern, and stroke width. */
export function LineStyle({ value, onChange, onReset }: LineStyleProps) {
	const curveType = value?.curveType ?? DEFAULT_LINE_STYLING.curveType;
	const lineType = value?.lineType ?? DEFAULT_LINE_STYLING.lineType;
	const lineWidth = value?.lineWidth ?? DEFAULT_LINE_STYLING.lineWidth;

	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Graph Curve Type
				</label>
				<Select
					value={curveType}
					onChange={(e) =>
						onChange({ curveType: e.target.value as CurveType })
					}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{CURVE_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Line Type
				</label>
				<Select
					value={lineType}
					onChange={(e) =>
						onChange({
							lineType: e.target.value as LineStyling["lineType"],
						})
					}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{LINE_TYPE_OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>
			<div>
				<div className="mb-1 flex items-center justify-between">
					<label className="font-semibold text-stone-600 text-xs">
						Line Width
					</label>
					<span className="font-medium text-stone-700 text-xs">
						{lineWidth}px
					</span>
				</div>
				<input
					type="range"
					min={1}
					max={6}
					step={1}
					value={lineWidth}
					onChange={(e) =>
						onChange({ lineWidth: Number(e.target.value) })
					}
					className="w-full accent-indigo-500"
				/>
			</div>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
