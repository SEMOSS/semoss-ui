import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, toast } from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility";
import type { ConversationMessage } from "../types/message";
import {
	type OwnedMessagePart,
	ownedMessageParts,
} from "../utils/message-presentation";

/** Persistent actions below a response, in the normal document and focus order. */
export function MessageActions({
	message,
	parts = ownedMessageParts(message),
}: {
	/** The response that owns these actions. */
	message: ConversationMessage;
	/** Includes visible continuations grouped into this response. */
	parts?: OwnedMessagePart[];
}) {
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
			setHasCopied(false);
			toast.error("Could not copy this response.");
		}
	}

	const hasActions = message.role === "assistant" && !!text.trim();
	if (!hasActions) return null;

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="pointer-coarse:min-h-11 min-w-24 justify-start text-muted-foreground text-xs"
				onClick={handleCopy}
			>
				{hasCopied ? (
					<Check aria-hidden="true" />
				) : (
					<Copy aria-hidden="true" />
				)}
				{hasCopied ? "Copied" : "Copy"}
				{!hasCopied && <span className="sr-only"> response</span>}
			</Button>
			<output className="sr-only">
				{hasCopied ? "Response copied" : ""}
			</output>
		</div>
	);
}
