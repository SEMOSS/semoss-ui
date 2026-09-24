import { Check, Copy, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";

/** Per-part controls occupy a fixed gutter, including on touch screens. */
export function MessagePartActions({
	text,
	kind = "text",
}: {
	text: string;
	kind?: "text" | "thinking";
}) {
	const [hasCopied, setHasCopied] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const label = `Copy ${kind}`;
	useEffect(() => {
		if (!hasCopied) return;
		const timer = window.setTimeout(() => setHasCopied(false), 1500);
		return () => window.clearTimeout(timer);
	}, [hasCopied]);

	async function handleCopy(): Promise<void> {
		try {
			await copyTextToClipboard(text);
			setHasCopied(true);
		} catch {
			toast.error(`Could not copy this ${kind}.`);
		}
	}

	if (!text.trim()) return null;
	return (
		<div
			className="group/part-actions size-8 shrink-0 text-muted-foreground"
			data-active={isMenuOpen || hasCopied}
		>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={
							hasCopied
								? `${kind === "thinking" ? "Thinking" : "Text"} copied`
								: label
						}
						onClick={handleCopy}
						className="pointer-events-none opacity-0 transition-opacity duration-150 ease-out group-focus-within/part:pointer-events-auto group-focus-within/part:opacity-100 group-focus-within/part:duration-0 group-hover/part:pointer-events-auto group-hover/part:opacity-100 group-data-[active=true]/part-actions:pointer-events-auto group-data-[active=true]/part-actions:opacity-100 motion-reduce:transition-none [@media(hover:none)]:hidden [@media(pointer:coarse)]:hidden"
					>
						{hasCopied ? (
							<Check aria-hidden="true" />
						) : (
							<Copy aria-hidden="true" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>{hasCopied ? "Copied" : label}</TooltipContent>
			</Tooltip>
			<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={
							kind === "thinking"
								? "Thinking actions"
								: "Text actions"
						}
						className="hidden [@media(hover:none)]:inline-flex [@media(pointer:coarse)]:inline-flex"
					>
						{hasCopied ? (
							<Check aria-hidden="true" />
						) : (
							<MoreHorizontal aria-hidden="true" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onSelect={() => void handleCopy()}>
						<Copy aria-hidden="true" />
						{label}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
