import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Code, CodeContainer, toast } from "@semoss/ui/next";

interface CodeBlockProps {
	code: string;
	language?: React.ComponentProps<typeof Code>["language"];
}

/**
 * Same copy-button + labeled-bar visual language as
 * @/components/shared/sdk-block.tsx, but with real Shiki syntax highlighting
 * (via @semoss/ui/next's Code component) instead of plain monospace text —
 * sdk-block.tsx renders access keys/plain strings, this renders real tsx.
 */
export const CodeBlock = ({ code, language = "tsx" }: CodeBlockProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Unable to copy code");
		}
	};

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				<span className="font-mono text-muted-foreground text-xs">
					{language}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-background hover:text-foreground"
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
					<Code code={code} language={language} />
				</CodeContainer>
			</div>
		</div>
	);
};
