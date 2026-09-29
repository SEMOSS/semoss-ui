import { Check, Copy } from "lucide-react";
import { type ReactElement, useEffect, useId, useState } from "react";
import {
	Button,
	Popover,
	PopoverAnchor,
	PopoverContent,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import { useMessageActionsPopover } from "../hooks/use-message-actions-popover";
import type { ConversationMessage } from "../types/message";
import {
	type OwnedMessagePart,
	ownedMessageParts,
} from "../utils/message-presentation";

/** Floating response actions anchored to the response itself, with no action row. */
export function MessageActions({
	message,
	parts = ownedMessageParts(message),
	children,
}: {
	message: ConversationMessage;
	/** Includes visible continuations grouped into this response. */
	parts?: OwnedMessagePart[];
	/** The response article acts as the hover, focus, and touch target. */
	children: ReactElement;
}) {
	const popover = useMessageActionsPopover();
	const instructionsId = useId();
	const contentId = useId();
	const [hasCopied, setHasCopied] = useState(false);
	const text =
		message.delegationReply?.text ??
		message.delegationRequest?.question ??
		parts
			.flatMap(({ message: owner, part }) =>
				owner.role === "assistant" &&
				part.type === "text" &&
				part.text.trim()
					? [part.text]
					: [],
			)
			.join("\n\n");
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
			toast.error("Could not copy this response.");
		}
	}

	const hasActions = message.role === "assistant" && !!text.trim();
	return (
		<Popover
			open={hasActions && popover.isOpen}
			onOpenChange={popover.setIsOpen}
		>
			<PopoverAnchor
				asChild
				{...(hasActions ? popover.anchorProps : {})}
				aria-describedby={hasActions ? instructionsId : undefined}
				aria-details={
					hasActions && popover.isOpen ? contentId : undefined
				}
			>
				{children}
			</PopoverAnchor>
			<PopoverContent
				{...popover.contentProps}
				id={contentId}
				align="end"
				side="top"
				className="w-36 p-1"
				aria-label="Response actions"
			>
				<Button
					ref={popover.actionRef}
					type="button"
					variant="ghost"
					size="sm"
					className="w-full justify-start text-xs"
					onClick={handleCopy}
				>
					{hasCopied ? (
						<Check aria-hidden="true" />
					) : (
						<Copy aria-hidden="true" />
					)}
					{hasCopied ? "Copied" : "Copy response"}
				</Button>
			</PopoverContent>
			{hasActions && (
				<span id={instructionsId} className="sr-only">
					Response actions available. Press Enter to access them.
				</span>
			)}
			{hasActions && (
				<output className="sr-only">
					{hasCopied ? "Response copied" : ""}
				</output>
			)}
		</Popover>
	);
}
