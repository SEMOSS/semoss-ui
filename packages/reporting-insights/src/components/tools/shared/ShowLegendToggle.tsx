import { Checkbox } from "@/components/ui";
import { ResetButton } from "./ResetButton";

interface ShowLegendToggleProps {
	value?: boolean;
	/** Override the checkbox label text. Defaults to "Show legend". */
	label?: string;
	/** Short description shown below the checkbox. */
	description?: string;
	onChange: (value: boolean) => void;
	onReset: () => void;
}

export function ShowLegendToggle({
	value,
	label = "Show legend",
	description,
	onChange,
	onReset,
}: ShowLegendToggleProps) {
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
