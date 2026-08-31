import { useId } from "react";
import { ResetButton } from "../shared/ResetButton";

interface BatchLoadingProps {
	value: boolean;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function BatchLoading({ value, onChange, onReset }: BatchLoadingProps) {
	const inputId = useId();
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<input
					type="checkbox"
					id={inputId}
					checked={value}
					onChange={(e) => onChange(e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor={inputId}
					className="font-medium text-sm text-stone-700"
				>
					Enable batch loading
				</label>
			</div>

			<p className="text-stone-500 text-xs">
				Loads rows in pages from the database. A{" "}
				<strong>Load more ↓</strong> button appears at the bottom of the
				table to fetch the next batch. Useful for very large datasets.
				Disabled by default — all rows are loaded at once.
			</p>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
