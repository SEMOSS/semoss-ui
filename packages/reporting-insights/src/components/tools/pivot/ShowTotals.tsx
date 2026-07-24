import { Checkbox } from "@/components/ui";
import type { PivotStyling } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface ShowTotalsProps {
	value?: PivotStyling["showTotals"];
	onChange: (value: PivotStyling["showTotals"]) => void;
	onReset: () => void;
}

export function ShowTotals({ value, onChange, onReset }: ShowTotalsProps) {
	const current = value || {};

	const update = (
		patch: Partial<NonNullable<PivotStyling["showTotals"]>>,
	) => {
		onChange({ ...current, ...patch });
	};

	// "All" toggles both row and column totals together
	const handleAllChange = (checked: boolean) => {
		update({ all: checked, rows: checked, columns: checked });
	};

	// When user toggles row/col individually, sync the "all" flag
	const handleIndividual = (key: "rows" | "columns", checked: boolean) => {
		const next = { ...current, [key]: checked };
		next.all = !!(next.rows && next.columns);
		onChange(next);
	};

	const Item = ({
		id,
		label,
		description,
		checked,
		onChange: handleChange,
	}: {
		id: string;
		label: string;
		description?: string;
		checked: boolean;
		onChange: (v: boolean) => void;
	}) => (
		<label
			htmlFor={id}
			className="flex cursor-pointer items-start gap-2 py-1"
		>
			<Checkbox
				type="checkbox"
				id={id}
				checked={checked}
				onChange={(e) => handleChange(e.target.checked)}
				className="mt-0.5 h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
			/>
			<div className="flex-1">
				<div className="font-medium text-sm text-stone-700">
					{label}
				</div>
				{description && (
					<div className="mt-0.5 text-stone-500 text-xs">
						{description}
					</div>
				)}
			</div>
		</label>
	);

	return (
		<div className="space-y-3">
			<Item
				id="totals-all"
				label="All grand totals"
				description="Show totals on both rows and columns"
				checked={!!current.all}
				onChange={handleAllChange}
			/>
			<div className="space-y-1 border-stone-100 border-t pt-2">
				<Item
					id="totals-rows"
					label="Grand total row"
					description="Adds a totals row at the bottom"
					checked={!!current.rows}
					onChange={(v) => handleIndividual("rows", v)}
				/>
				<Item
					id="totals-cols"
					label="Grand total column"
					description="Adds a totals column on the right"
					checked={!!current.columns}
					onChange={(v) => handleIndividual("columns", v)}
				/>
				<Item
					id="totals-sub"
					label="Subtotals"
					description="Insert subtotal rows for grouped row dimensions"
					checked={!!current.subtotals}
					onChange={(v) => update({ subtotals: v })}
				/>
			</div>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
