import type { ReactNode } from "react";
import { cn, Muted } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { DelegationReplyCard } from "@/features/delegations/components/delegation-reply-card";
import { DelegationRequestCard } from "@/features/delegations/components/delegation-request-card";
import type { ConversationMessage } from "../types/message";
import {
	messagePartBlocks,
	type OwnedMessagePart,
	ownedMessageParts,
} from "../utils/message-presentation";
import { MessageActions } from "./message-actions";
import { MessagePart } from "./message-part";
import { MessageTimestamp } from "./message-timestamp";
import { MessageToolActivity } from "./message-tool-activity";

/** One response shell, with original ownership retained for every part. */
export function MessageTimelineEntry({
	message,
	agent,
	parts = ownedMessageParts(message),
	createdAt = message.createdAt,
	userMessageTone = "accent",
	layout = "chat",
	leadingVisual,
}: {
	message: ConversationMessage;
	agent: AgentConfiguration;
	/** Presentation parts may span several consecutive assistant messages. */
	parts?: OwnedMessagePart[];
	createdAt?: string;
	/** Tone for user bubbles in the direct-room layout. */
	userMessageTone?: "accent" | "muted";
	/** Work can distinguish assistant turns from source cards with opposing bubbles. */
	layout?: "chat" | "flat" | "bubbles";
	/** Optional decorative Work identity; direct chat keeps its own avatar. */
	leadingVisual?: ReactNode;
}) {
	const isUser = message.role === "user";
	const isFlat = layout === "flat";
	const isBubble = layout === "bubbles";
	const isWork = isFlat || isBubble;
	const reply = message.delegationReply;
	const request = message.delegationRequest;
	const isDelegation = !!(reply || request);

	return (
		<article
			data-layout={layout}
			className={cn(
				"group/message relative flex min-w-0 gap-3",
				!isWork && "mt-6 flex-col first:mt-0",
				!isWork && isUser
					? "ms-auto max-w-prose items-end"
					: !isBubble && "w-full",
				isBubble &&
					"w-fit @md/conversation:max-w-prose max-w-full flex-col",
				isBubble && (isUser ? "ms-auto ps-4" : "me-auto pe-4"),
			)}
			aria-label={
				isUser
					? "Your message"
					: `${reply?.assignee ?? request?.requester ?? agent.name}'s message`
			}
		>
			{isFlat &&
				!isDelegation &&
				(leadingVisual ?? (
					<AgentAvatar
						agent={isUser ? { name: "You" } : agent}
						size="sm"
					/>
				))}
			<div className="flex min-w-0 max-w-full flex-1 flex-col gap-2">
				{!isDelegation && (!isUser || isFlat) && (
					<div className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
						{isBubble
							? (leadingVisual ?? (
									<AgentAvatar agent={agent} size="xs" />
								))
							: !isFlat && (
									<AgentAvatar agent={agent} size="xs" />
								)}
						<Muted className="wrap-anywhere font-medium text-foreground text-sm">
							{isUser ? "You" : agent.name}
						</Muted>
						{!isBubble && (
							<MessageTimestamp
								createdAt={createdAt}
								className={isWork ? "opacity-100" : undefined}
							/>
						)}
					</div>
				)}
				<div
					className={cn(
						"flex min-w-0 max-w-full flex-col gap-2",
						!isWork &&
							isUser &&
							"rounded-2xl px-4 py-3 text-foreground",
						!isWork &&
							isUser &&
							(userMessageTone === "muted"
								? "bg-muted"
								: "bg-primary/5"),
						isBubble && "overflow-hidden rounded-2xl px-4 py-3",
						isBubble &&
							(isUser
								? "rounded-br-md bg-primary/10 text-foreground dark:bg-primary/20"
								: "rounded-bl-md border border-border bg-card text-card-foreground"),
					)}
				>
					{isDelegation && (
						<div className="min-w-0">
							{reply && <DelegationReplyCard reply={reply} />}
							{request && (
								<DelegationRequestCard request={request} />
							)}
						</div>
					)}
					{!isDelegation &&
						messagePartBlocks(parts).map((block) =>
							block.type === "tools" ? (
								<MessageToolActivity
									key={block.key}
									items={block.items}
								/>
							) : (
								<div
									key={block.key}
									data-scroll-anchor={block.key}
									className={cn(
										"min-w-0 max-w-full",
										isBubble &&
											isUser &&
											block.item.part.type === "media" &&
											"rounded-xl bg-background p-1 text-foreground",
									)}
								>
									<MessagePart
										part={block.item.part}
										role={block.item.message.role}
										phase={block.item.message.live?.phase}
										createdAt={block.item.message.createdAt}
										agentName={agent.name}
									/>
								</div>
							),
						)}
				</div>
				<MessageActions message={message} parts={parts} />
				{!isBubble && ((!isWork && isUser) || isDelegation) && (
					<MessageTimestamp
						createdAt={createdAt}
						className="absolute end-2 top-full pt-1"
					/>
				)}
			</div>
		</article>
	);
}
