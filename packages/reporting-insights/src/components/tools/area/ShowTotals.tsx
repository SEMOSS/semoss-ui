import { ResetButton } from "../shared/ResetButton";

interface ShowTotalsProps {
	value?: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function ShowTotals({ value, onChange, onReset }: ShowTotalsProps) {
	return (
		<div className="space-y-4">
			<label className="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					checked={value ?? false}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<span className="font-medium text-sm text-stone-700">
					Show column totals
				</span>
			</label>
			<p className="text-stone-500 text-xs">
				Displays the sum of all series values at the top of each
				category.
			</p>
			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
