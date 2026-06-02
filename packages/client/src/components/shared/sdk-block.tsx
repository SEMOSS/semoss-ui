import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { CodeContainer, toast } from "@semoss/ui/next";

interface SdkBlockProps {
	/** Caption shown in the top bar (e.g. "access key"). */
	label: string;
	/** Code/text content rendered in the monospace body. */
	code: string;
	/** Optional data-testid for the copy button. */
	testId?: string;
}

export const SdkBlock = ({ label, code, testId }: SdkBlockProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Unable to copy code");
		}
	};

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				<span className="font-mono text-muted-foreground text-xs">
					{label}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-background hover:text-foreground"
					data-testid={testId}
				>
					{copied ? (
						<>
							<Check className="size-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="size-3" />
							Copy
						</>
					)}
				</button>
			</div>
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4 text-sm">
					{code}
				</CodeContainer>
			</div>
		</div>
	);
};
