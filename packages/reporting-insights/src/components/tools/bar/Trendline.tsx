import { Select } from "@/components/ui";
import type { CurveType } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

type TrendlineType = CurveType | "none";

interface TrendlineProps {
	value?: TrendlineType;
	onChange: (value: TrendlineType) => void;
	onReset: () => void;
}

const OPTIONS: { value: TrendlineType; label: string }[] = [
	{ value: "none", label: "Off" },
	{ value: "exact", label: "Exact" },
	{ value: "smooth", label: "Smooth" },
	{ value: "stepStart", label: "Step (Start)" },
	{ value: "stepMiddle", label: "Step (Middle)" },
	{ value: "stepEnd", label: "Step (End)" },
];

/** Trendline curve-type selector for bar charts. `'none'` hides the trendline. */
export function Trendline({ value, onChange, onReset }: TrendlineProps) {
	const v: TrendlineType = value ?? "none";
	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Trendline Type
				</label>
				<Select
					value={v}
					onChange={(e) => onChange(e.target.value as TrendlineType)}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>
			<p className="text-stone-500 text-xs">
				Overlays a fitted line across the first Y series. Step variants
				snap between points.
			</p>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
