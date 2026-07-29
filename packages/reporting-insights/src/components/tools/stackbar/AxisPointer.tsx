import { Select } from "@/components/ui";
import { ResetButton } from "../shared/ResetButton";

type AxisPointerType = "shadow" | "line" | "cross";

interface AxisPointerProps {
	value?: AxisPointerType;
	onChange: (value: AxisPointerType) => void;
	onReset: () => void;
}

const OPTIONS: { value: AxisPointerType; label: string }[] = [
	{ value: "shadow", label: "Shadow (default)" },
	{ value: "line", label: "Line" },
	{ value: "cross", label: "Cross" },
];

export function AxisPointer({ value, onChange, onReset }: AxisPointerProps) {
	return (
		<div className="space-y-3">
			<div>
				<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
					Pointer Style
				</label>
				<Select
					value={value ?? "shadow"}
					onChange={(e) =>
						onChange(e.target.value as AxisPointerType)
					}
					className="w-full rounded border border-stone-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
				>
					{OPTIONS.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</Select>
			</div>
			<p className="text-stone-500 text-xs">
				Controls the cursor highlight style when hovering over bars.
			</p>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
