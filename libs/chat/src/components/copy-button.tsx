import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "../lib/clipboard";

export interface CopyButtonProps {
	value: string;
	label: string;
}

/** Shared copy-to-clipboard action for block headers (code/table/mermaid/HTML preview) — swaps to a checkmark briefly instead of a toast, matching the rest of @semoss/chat's low-stakes convenience actions. */
export function CopyButton({ value, label }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	function handleCopy() {
		copyToClipboard(
			value,
			() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			},
			() => {
				// Clipboard write failing (permissions, insecure context) isn't
				// worth surfacing as an error state here — the button just
				// silently stays in its un-copied state.
			},
		);
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label={label}
			className="inline-flex size-5 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
		>
			{copied ? (
				<CheckIcon className="size-3.5" />
			) : (
				<CopyIcon className="size-3.5" />
			)}
		</button>
	);
}
