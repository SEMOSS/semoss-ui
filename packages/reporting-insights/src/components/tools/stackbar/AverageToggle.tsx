import { Checkbox } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

interface AverageToggleProps {
	value?: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function AverageToggle({
	value,
	onChange,
	onReset,
}: AverageToggleProps) {
	return (
		<div className="space-y-4">
			<label className="flex cursor-pointer items-center gap-2">
				<Checkbox
					type="checkbox"
					checked={value ?? false}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<span className="font-medium text-sm text-stone-700">
					Show average line
				</span>
			</label>
			<p className="text-stone-500 text-xs">
				Draws a dashed average line for each series, colored to match
				its bars.
			</p>
			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
