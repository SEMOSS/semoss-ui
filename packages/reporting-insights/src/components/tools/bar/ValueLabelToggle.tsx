import { Checkbox } from "@/components/ui";
import { DEFAULT_BAR_STYLING } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface ValueLabelToggleProps {
	value?: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

/** Toggle the numeric label rendered above each bar. */
export function ValueLabelToggle({
	value,
	onChange,
	onReset,
}: ValueLabelToggleProps) {
	const checked = value ?? DEFAULT_BAR_STYLING.showValueLabels;
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id="bar-show-value-labels"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor="bar-show-value-labels"
					className="font-medium text-sm text-stone-700"
				>
					Show value labels
				</label>
			</div>
			<p className="text-stone-500 text-xs">
				Renders the aggregated numeric value above each bar.
			</p>
			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
