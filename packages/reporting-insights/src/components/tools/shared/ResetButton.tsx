import { RotateCcw } from "lucide-react";

interface ResetButtonProps {
	onReset: () => void;
	label?: string;
}

export function ResetButton({
	onReset,
	label = "Reset to Default",
}: ResetButtonProps) {
	return (
		<button
			type="button"
			onClick={onReset}
			className="inline-flex items-center gap-2 rounded border border-stone-200 bg-white px-3 py-1.5 font-semibold text-stone-600 text-xs transition-colors hover:bg-stone-100 hover:text-stone-900"
		>
			<RotateCcw className="h-3.5 w-3.5" />
			{label}
		</button>
	);
}
