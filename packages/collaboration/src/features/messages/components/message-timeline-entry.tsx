import { cn, Muted } from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import { DelegationReplyCard } from "@/features/delegations/components/delegation-reply-card";
import { DelegationRequestCard } from "@/features/delegations/components/delegation-request-card";
import type { ConversationMessage } from "../types/message";
import { messageText } from "../utils/message-metadata";
import {
	messagePartBlocks,
	type OwnedMessagePart,
	ownedMessageParts,
} from "../utils/message-presentation";
import { MessagePart } from "./message-part";
import { MessagePartActions } from "./message-part-actions";
import { MessageTimestamp } from "./message-timestamp";
import { MessageToolActivity } from "./message-tool-activity";

/** One response shell, with original ownership retained for every part. */
export function MessageTimelineEntry({
	message,
	agent,
	parts = ownedMessageParts(message),
	createdAt = message.createdAt,
}: {
	message: ConversationMessage;
	agent: AgentConfiguration;
	/** Presentation parts may span several consecutive assistant messages. */
	parts?: OwnedMessagePart[];
	createdAt?: string;
}) {
	const isUser = message.role === "user";
	const reply = message.delegationReply;
	const request = message.delegationRequest;
	const isDelegation = !!(reply || request);

	return (
		<article
			className={cn(
				"group/message relative mt-6 flex min-w-0 flex-col gap-3 first:mt-0",
				isUser ? "ms-auto max-w-prose items-end" : "w-full",
			)}
			aria-label={
				isUser
					? "Your message"
					: `${reply?.assignee ?? request?.requester ?? agent.name}'s message`
			}
		>
			{!isUser && !isDelegation && (
				<div className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
					<AgentAvatar agent={agent} size="xs" />
					<Muted className="wrap-anywhere font-medium text-foreground text-sm">
						{agent.name}
					</Muted>
					<MessageTimestamp createdAt={createdAt} />
				</div>
			)}
			<div
				className={cn(
					"flex min-w-0 max-w-full flex-col gap-3",
					isUser &&
						"rounded-2xl bg-primary/5 px-4 py-3 text-foreground",
				)}
			>
				{isDelegation && (
					<div className="group/part flex min-w-0 items-start gap-2">
						<div className="min-w-0 flex-1">
							{reply && <DelegationReplyCard reply={reply} />}
							{request && (
								<DelegationRequestCard request={request} />
							)}
						</div>
						<MessagePartActions text={messageText(message)} />
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
							<div key={block.key} data-scroll-anchor={block.key}>
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
			{(isUser || isDelegation) && (
				<MessageTimestamp
					createdAt={createdAt}
					className="absolute end-2 top-full pt-1"
				/>
			)}
		</article>
	);
}
