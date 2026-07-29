import { Checkbox } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

interface FlipSeriesProps {
	value?: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function FlipSeries({ value, onChange, onReset }: FlipSeriesProps) {
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
					Flip series
				</span>
			</label>
			<p className="text-stone-500 text-xs">
				Swaps what appears on the category axis with what is stacked.
				Each original category becomes a stack, and each original stack
				becomes a category.
			</p>
			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
