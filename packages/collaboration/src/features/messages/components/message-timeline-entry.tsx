import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	cn,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import type { Agent } from "@/features/agents/types/agent";
import { DelegationReplyCard } from "@/features/delegations/components/delegation-reply-card";
import { DelegationRequestCard } from "@/features/delegations/components/delegation-request-card";
import { ToolCallCard } from "@/features/tools/components/tool-call-card";
import type { ConversationMessage } from "../types/message";
import { MessageActivityPart } from "./message-activity-part";
import { MessageMarkdown } from "./message-markdown";
import { MessageMediaPart } from "./message-media-part";
import { MessageThinkingPart } from "./message-thinking-part";

function formatMessageTime(value: string | undefined): string {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return new Intl.DateTimeFormat(undefined, {
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function messageText(message: ConversationMessage): string {
	if (message.delegationReply) return message.delegationReply.text ?? "";
	if (message.delegationRequest) return message.delegationRequest.question;
	return message.parts
		.flatMap((part) => {
			if (part.type === "text" || part.type === "thinking")
				return [part.text];
			return [];
		})
		.join("\n\n");
}

/** One user or assistant message, styled and composed like Playground. */
export function MessageTimelineEntry({
	message,
	agent,
}: {
	message: ConversationMessage;
	agent: Agent;
}) {
	const [hasCopied, setHasCopied] = useState(false);
	const isUser = message.role === "user";
	const reply = message.delegationReply;
	const request = message.delegationRequest;
	// Platform cards speak for a person, so they carry no agent label.
	const card = reply !== undefined || request !== undefined;
	const time = formatMessageTime(message.createdAt);
	const isLive =
		message.live !== undefined &&
		message.live.phase !== "completed" &&
		message.live.phase !== "failed";

	useEffect(() => {
		if (!hasCopied) return;
		const timer = window.setTimeout(() => setHasCopied(false), 1500);
		return () => window.clearTimeout(timer);
	}, [hasCopied]);

	async function handleCopy() {
		const text = messageText(message);
		if (!text) {
			toast.warning("This message has no text to copy.");
			return;
		}
		try {
			await navigator.clipboard.writeText(text);
			setHasCopied(true);
		} catch {
			toast.error("Could not copy this message.");
		}
	}

	return (
		<article
			className={cn(
				"group flex min-w-0 flex-col gap-2",
				isUser ? "ms-auto max-w-3xl items-end" : "w-full pe-0 sm:pe-10",
			)}
			aria-label={
				isUser
					? "Your message"
					: `${reply?.assignee ?? request?.requester ?? agent.name}'s message`
			}
		>
			{!isUser && !card && (
				<span className="font-medium text-muted-foreground text-xs">
					{agent.name}
				</span>
			)}
			<div
				className={cn(
					"flex min-w-0 flex-col gap-2",
					isUser && "rounded-lg bg-accent px-3 py-2",
				)}
			>
				{reply && <DelegationReplyCard reply={reply} />}
				{request && <DelegationRequestCard request={request} />}
				{!card &&
					message.parts.map((part, index) => {
						const key = `${message.id}-${part.type}-${index}`;
						switch (part.type) {
							case "text":
								return isUser ? (
									<P
										key={key}
										dir="auto"
										className="whitespace-pre-wrap text-sm leading-6"
									>
										{part.text}
									</P>
								) : (
									<MessageMarkdown
										key={key}
										text={part.text}
										isStreaming={
											isLive && part.state === "active"
										}
									/>
								);
							case "thinking":
								return (
									<MessageThinkingPart
										key={key}
										text={part.text}
										isStreaming={
											isLive && part.state === "active"
										}
									/>
								);
							case "tool":
								return (
									<ToolCallCard key={key} tool={part.tool} />
								);
							case "media":
								return (
									<MessageMediaPart
										key={key}
										fileName={part.fileName}
										mimeType={part.mimeType}
									/>
								);
						}
						return null;
					})}
				<MessageActivityPart message={message} />
			</div>
			<div className="flex min-h-8 items-center gap-1 text-muted-foreground">
				{time && (
					<time dateTime={message.createdAt} className="px-2 text-xs">
						{time}
					</time>
				)}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={
								hasCopied ? "Message copied" : "Copy message"
							}
							disabled={!messageText(message)}
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
			</div>
		</article>
	);
}
