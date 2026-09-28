import { Check, Copy, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import type { ConversationMessage } from "../types/message";
import { formatMessageTime, messageText } from "../utils/message-metadata";

/** Contextual message metadata, with an explicit touch-accessible menu. */
export function MessageActions({ message }: { message: ConversationMessage }) {
	const [hasCopied, setHasCopied] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const text = messageText(message);
	const time = formatMessageTime(message.createdAt);
	const fullTime = formatMessageTime(message.createdAt, true);
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
			toast.error("Could not copy this message.");
		}
	}

	if (!time && !text) return null;
	return (
		<div
			className="group/actions flex min-h-8 items-center text-muted-foreground"
			data-menu-open={isMenuOpen || hasCopied}
		>
			<div className="pointer-events-none flex items-center gap-1 opacity-0 transition-opacity duration-150 ease-out group-focus-within/message:pointer-events-auto group-focus-within/message:opacity-100 group-focus-within/message:duration-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-data-[menu-open=true]/actions:pointer-events-auto group-data-[menu-open=true]/actions:opacity-100 motion-reduce:transition-none [@media(hover:none)]:hidden [@media(pointer:coarse)]:hidden">
				{time && (
					<time
						dateTime={message.createdAt}
						title={fullTime}
						className="px-2 text-xs"
					>
						{time}
					</time>
				)}
				{text && (
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								aria-label={
									hasCopied
										? "Message copied"
										: "Copy message"
								}
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
							{hasCopied ? "Copied" : "Copy message"}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						className={cn(
							"hidden [@media(hover:none)]:inline-flex [@media(pointer:coarse)]:inline-flex",
							hasCopied && "text-success",
						)}
						aria-label="Message actions"
					>
						{hasCopied ? (
							<Check aria-hidden="true" />
						) : (
							<MoreHorizontal aria-hidden="true" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align={message.role === "user" ? "end" : "start"}
				>
					{time && (
						<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
							<time dateTime={message.createdAt}>{fullTime}</time>
						</DropdownMenuLabel>
					)}
					{text && (
						<DropdownMenuItem onSelect={() => void handleCopy()}>
							<Copy aria-hidden="true" />
							Copy message
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
