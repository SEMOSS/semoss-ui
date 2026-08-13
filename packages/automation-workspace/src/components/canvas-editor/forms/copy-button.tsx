import { Check, Copy } from "lucide-react";
import { useState } from "react";

export interface CopyButtonProps {
	/** Value copied to the clipboard */
	value: string;
	/** Button label, shown when not in the "copied" state */
	label?: string;
}

export function CopyButton({ value, label }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard
					.writeText(value)
					.then(() => {
						setCopied(true);
						setTimeout(() => setCopied(false), 1500);
					})
					.catch(() => {});
			}}
			className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
		>
			{copied ? (
				<Check className="h-3 w-3 text-emerald-500" />
			) : (
				<Copy className="h-3 w-3" />
			)}
			{label ?? "Copy"}
		</button>
	);
}
