import { memo } from "react";
import { P } from "@semoss/ui/next";
import { AgentRunCard } from "@/features/runs/components/agent-run-card";
import { ToolCallCard } from "@/features/tools/components/tool-call-card";
import type {
	ConversationMessage,
	ConversationMessagePart,
	PlaygroundTurnPhase,
} from "../types/message";
import { MessageMarkdown } from "./message-markdown";
import { MessageMediaPart } from "./message-media-part";
import { MessagePartActions } from "./message-part-actions";
import { MessageThinkingPart } from "./message-thinking-part";

/** Render one part with its source message's streaming lifecycle. */
export const MessagePart = memo(function MessagePart({
	part,
	role,
	phase,
	createdAt,
	agentName,
}: {
	part: ConversationMessagePart;
	role: ConversationMessage["role"];
	phase?: PlaygroundTurnPhase;
	createdAt?: string;
	agentName: string;
}) {
	const shouldFlush =
		phase === "cancelled" ||
		phase === "cancelling" ||
		phase === "failed" ||
		phase === "awaiting_approval";
	const isLive = !!phase && phase !== "completed" && !shouldFlush;
	switch (part.type) {
		case "text":
			return (
				<div className="group/part flex min-w-0 items-start gap-2">
					<div className="min-w-0 max-w-prose flex-1">
						{role === "user" ? (
							<P
								dir="auto"
								className="wrap-anywhere whitespace-pre-wrap text-base leading-7"
							>
								{part.text}
							</P>
						) : (
							<MessageMarkdown
								text={part.text}
								shouldFlush={shouldFlush}
								isStreaming={isLive && part.state === "active"}
							/>
						)}
					</div>
					<MessagePartActions text={part.text} />
				</div>
			);
		case "thinking":
			return (
				<div className="group/part flex min-w-0 items-start gap-2">
					<div className="min-w-0 flex-1">
						<MessageThinkingPart
							text={part.text}
							shouldFlush={shouldFlush}
							isStreaming={isLive && part.state === "active"}
						/>
					</div>
					<MessagePartActions text={part.text} kind="thinking" />
				</div>
			);
		case "tool":
			return <ToolCallCard tool={part.tool} createdAt={createdAt} />;
		case "run":
			return (
				<AgentRunCard
					compact
					run={{
						...part.run,
						workspaceName:
							part.run.workspaceName ||
							(!part.run.parentRunId ? agentName : undefined),
					}}
				/>
			);
		case "media":
			return (
				<MessageMediaPart
					fileName={part.fileName}
					mimeType={part.mimeType}
				/>
			);
	}
});
