import { Checkbox } from "@/components/ui";
import { DEFAULT_PIE_STYLING } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface DonutToggleProps {
	value?: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

/** Toggle between full-pie and donut rendering. */
export function DonutToggle({ value, onChange, onReset }: DonutToggleProps) {
	const checked = value ?? DEFAULT_PIE_STYLING.donut;
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id="pie-donut"
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor="pie-donut"
					className="font-medium text-sm text-stone-700"
				>
					Donut chart
				</label>
			</div>
			<p className="text-stone-500 text-xs">
				Carves out the center of the pie, leaving a ring.
			</p>
			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
