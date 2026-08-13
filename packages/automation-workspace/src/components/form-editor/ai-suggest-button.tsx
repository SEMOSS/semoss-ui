import { Loader2, Sparkles } from "lucide-react";

export interface AiSuggestButtonProps {
	/** Action to invoke when clicked. */
	onClick: () => void;
	/** Shows a spinner instead of the sparkles icon when true. */
	loading?: boolean;
	/** Disables the button (in addition to loading). */
	disabled?: boolean;
	/** Tooltip for the button. */
	title?: string;
	/** Label text shown next to the icon (defaults to "Suggest"). */
	label?: string;
}

/** Uniform AI assist trigger button — used beside field labels across the editor. */
export function AiSuggestButton({
	onClick,
	loading = false,
	disabled = false,
	title,
	label = "Suggest",
}: AiSuggestButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled || loading}
			title={title}
			className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
		>
			{loading ? (
				<Loader2 className="h-3 w-3 animate-spin" />
			) : (
				<Sparkles className="h-3 w-3" />
			)}
			{label}
		</button>
	);
}
