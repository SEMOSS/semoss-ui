import { DEFAULT_BAR_STYLING } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface BarWidthProps {
	value?: number;
	onChange: (value: number) => void;
	onReset: () => void;
}

/** Slider editor for the maximum bar width (px). Maps to recharts `maxBarSize`. */
export function BarWidth({ value, onChange, onReset }: BarWidthProps) {
	const v = value ?? DEFAULT_BAR_STYLING.barWidth;
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-stone-500 text-xs">Width</span>
				<span className="font-medium text-stone-700 text-xs">
					{v}px
				</span>
			</div>
			<input
				type="range"
				min={10}
				max={120}
				step={2}
				value={v}
				onChange={(e) => onChange(Number(e.target.value))}
				className="w-full accent-indigo-500"
			/>
			<p className="text-stone-500 text-xs">
				Maximum width of each bar in pixels. Bars scale down to fit when
				needed.
			</p>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
