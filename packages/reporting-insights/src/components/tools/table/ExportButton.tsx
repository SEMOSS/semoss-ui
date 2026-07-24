import { Checkbox } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

interface ExportButtonProps {
	value: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function ExportButton({ value, onChange, onReset }: ExportButtonProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id="show-export"
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor="show-export"
					className="font-medium text-sm text-stone-700"
				>
					Show export to CSV button
				</label>
			</div>

			<p className="text-stone-500 text-xs">
				Displays a button to export the table data to CSV format.
			</p>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
