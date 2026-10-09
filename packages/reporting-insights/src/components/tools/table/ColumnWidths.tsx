import { useId } from "react";
import { Checkbox } from "@/components/ui";
import type { ColumnWidthsConfig } from "@/types/dashboard";
import { ResetButton } from "../shared/ResetButton";

interface ColumnWidthsProps {
	value?: ColumnWidthsConfig;
	onChange: (value: ColumnWidthsConfig) => void;
	onReset: () => void;
}

export function ColumnWidths({ value, onChange, onReset }: ColumnWidthsProps) {
	const currentValue: ColumnWidthsConfig = value ?? {
		enabled: false,
		widths: {},
	};
	const enabledId = useId();

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Checkbox
					type="checkbox"
					id={enabledId}
					checked={currentValue.enabled}
					onChange={(e) =>
						onChange({ ...currentValue, enabled: e.target.checked })
					}
					className="h-4 w-4 rounded border-stone-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
				/>
				<label
					htmlFor={enabledId}
					className="font-medium text-sm text-stone-700"
				>
					Enable column resizing
				</label>
			</div>

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
