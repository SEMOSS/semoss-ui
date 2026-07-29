import { Select } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

type ZoomType = "none" | "radius" | "angle";

interface PolarZoomProps {
	value?: ZoomType;
	onChange: (value: ZoomType) => void;
	onReset: () => void;
}

const OPTIONS: { value: ZoomType; label: string }[] = [
	{ value: "none", label: "None (default)" },
	{ value: "radius", label: "Radius Zoom" },
	{ value: "angle", label: "Angle Zoom" },
];

export function PolarZoom({ value, onChange, onReset }: PolarZoomProps) {
	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Zoom Mode
				</label>
				<Select
					value={value ?? "none"}
					onChange={(e) => onChange(e.target.value as ZoomType)}
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
				Radius zoom scales the radial extent; Angle zoom limits the
				visible category range.
			</p>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
