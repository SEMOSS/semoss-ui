import { Checkbox } from "@/components/ui";
import type { WrapTextConfig } from "@/types/dashboard";
import { ColumnMultiSelect } from "../shared/ColumnMultiSelect";
import { ResetButton } from "../shared/ResetButton";

interface WrapTextProps {
	columns: string[];
	value?: WrapTextConfig;
	onChange: (value: WrapTextConfig) => void;
	onReset: () => void;
}

export function WrapText({ columns, value, onChange, onReset }: WrapTextProps) {
	const currentValue: WrapTextConfig = value || {
		columns: [],
		enabled: false,
	};

	const updateField = <K extends keyof WrapTextConfig>(
		field: K,
		val: WrapTextConfig[K],
	) => {
		onChange({ ...currentValue, [field]: val });
	};

	return (
		<div className="space-y-4">
			<ColumnMultiSelect
				label="Select Columns"
				columns={columns}
				selectedColumns={currentValue.columns}
				onChange={(selected) => updateField("columns", selected)}
			/>

			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id="wrap-enabled"
					checked={currentValue.enabled}
					onChange={(e) => updateField("enabled", e.target.checked)}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor="wrap-enabled"
					className="font-medium text-sm text-stone-700"
				>
					Enable text wrapping
				</label>
			</div>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
