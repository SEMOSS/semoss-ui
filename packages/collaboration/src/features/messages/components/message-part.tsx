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
				<div className="min-w-0 max-w-prose">
					{role === "user" ? (
						<P
							dir="auto"
							className="wrap-anywhere whitespace-pre-wrap text-sm leading-6 group-data-[layout=bubbles]/message:text-base"
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
			);
		case "thinking":
			return (
				<MessageThinkingPart
					text={part.text}
					shouldFlush={shouldFlush}
					isStreaming={isLive && part.state === "active"}
				/>
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
					fileLocation={part.fileLocation}
					mimeType={part.mimeType}
				/>
			);
	}
});
