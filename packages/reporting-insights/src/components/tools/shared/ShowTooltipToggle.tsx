import { Checkbox } from "@/components/ui";
import { ResetButton } from "./ResetButton";

interface ShowTooltipToggleProps {
	value?: boolean;
	/** Override the checkbox label text. Defaults to "Show tooltip on hover". */
	label?: string;
	/** Short description shown below the checkbox. */
	description?: string;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function ShowTooltipToggle({
	value,
	label = "Show tooltip on hover",
	description,
	onChange,
	onReset,
}: ShowTooltipToggleProps) {
	const checked = value ?? true;
	return (
		<div className="space-y-4">
			<label className="flex cursor-pointer items-center gap-2">
				<Checkbox
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className="font-medium text-sm text-stone-700">
					{label}
				</span>
			</label>

			{description && (
				<p className="text-stone-500 text-xs">{description}</p>
			)}

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
