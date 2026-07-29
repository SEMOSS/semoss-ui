import { ResetButton } from "../shared/ResetButton";

interface UnstackToggleProps {
	value?: boolean;
	onChange: (v: boolean) => void;
	onReset: () => void;
}

export function UnstackToggle({
	value = false,
	onChange,
	onReset,
}: UnstackToggleProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-stone-600 text-xs">
					Unstack bars (grouped)
				</span>
				<button
					type="button"
					onClick={() => onChange(!value)}
					className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
						value ? "bg-indigo-500" : "bg-stone-300"
					}`}
				>
					<span
						className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
							value ? "translate-x-[18px]" : "translate-x-[2px]"
						}`}
					/>
				</button>
			</div>
			<p className="text-stone-400 text-xs">
				When on, categories are rendered side-by-side instead of
				stacked.
			</p>
			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
