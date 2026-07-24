import { Checkbox } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

interface RowSpanningProps {
	value: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function RowSpanning({ value, onChange, onReset }: RowSpanningProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id="row-spanning"
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor="row-spanning"
					className="font-medium text-sm text-stone-700"
				>
					Show row spanning
				</label>
			</div>

			<p className="text-stone-500 text-xs">
				Merges adjacent cells with identical values in the same column.
			</p>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
