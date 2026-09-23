import { Check, Copy, Expand } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Code,
	CodeContainer,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { normalizeCodeLanguage } from "../utils/normalize-code-language";

/** Inline generated code with a stable loading state and completed actions. */
export function MessageCodeBlock({
	code,
	language,
	isStreaming = false,
}: {
	code: string;
	language?: string | null;
	isStreaming?: boolean;
}) {
	const normalized = normalizeCodeLanguage(language);
	const [isExpanded, setIsExpanded] = useState(false);
	const [hasCopied, setHasCopied] = useState(false);

	useEffect(() => {
		if (!hasCopied) return;
		const timer = window.setTimeout(() => setHasCopied(false), 1500);
		return () => window.clearTimeout(timer);
	}, [hasCopied]);

	async function handleCopy(): Promise<void> {
		try {
			await copyTextToClipboard(code);
			setHasCopied(true);
		} catch {
			toast.error("Could not copy this code.");
		}
	}

	return (
		<>
			<div
				className="my-2 overflow-hidden rounded-md border bg-background"
				aria-busy={isStreaming}
			>
				<div className="flex min-h-8 items-center gap-2 border-b bg-muted px-2 py-1">
					{isStreaming && (
						<Spinner
							aria-hidden="true"
							className="size-3 shrink-0 motion-reduce:animate-none"
						/>
					)}
					<span className="min-w-0 flex-1 truncate font-mono text-foreground text-xs">
						{isStreaming
							? `Generating ${normalized.label}…`
							: normalized.label}
					</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={
									hasCopied ? "Code copied" : "Copy code"
								}
								disabled={isStreaming || !code}
								onClick={handleCopy}
							>
								{hasCopied ? (
									<Check aria-hidden="true" />
								) : (
									<Copy aria-hidden="true" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{hasCopied ? "Copied" : "Copy code"}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label="Expand code"
								disabled={isStreaming || !code}
								onClick={() => setIsExpanded(true)}
							>
								<Expand aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Expand code</TooltipContent>
					</Tooltip>
				</div>
				<section
					className="focus-visible:-outline-offset-2 max-h-96 overflow-auto bg-muted/30 p-3 focus-visible:outline-2 focus-visible:outline-ring"
					aria-label={`${normalized.label} code`}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: the bounded two-dimensional code scroller must be keyboard reachable
					tabIndex={0}
				>
					<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-0">
						{isStreaming ? (
							<code className="font-mono text-xs">{code}</code>
						) : (
							<Code
								code={code}
								language={normalized.language}
								className="text-xs"
							/>
						)}
					</CodeContainer>
				</section>
			</div>

			<Dialog open={isExpanded} onOpenChange={setIsExpanded}>
				<DialogContent className="flex max-h-dvh flex-col overflow-hidden sm:max-w-5xl">
					<DialogHeader>
						<DialogTitle>{normalized.label} code</DialogTitle>
						<DialogDescription>
							Read-only generated code.
						</DialogDescription>
					</DialogHeader>
					<section
						className="focus-visible:-outline-offset-2 min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30 p-3 focus-visible:outline-2 focus-visible:outline-ring"
						aria-label={`Expanded ${normalized.label} code`}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: the expanded code scroller must be keyboard reachable
						tabIndex={0}
					>
						<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-0">
							<Code
								code={code}
								language={normalized.language}
								className="text-xs"
							/>
						</CodeContainer>
					</section>
				</DialogContent>
			</Dialog>
		</>
	);
}
