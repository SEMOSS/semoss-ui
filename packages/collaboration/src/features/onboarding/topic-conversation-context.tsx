import { useEffect, useRef, useState } from "react";
import { Button, Muted, P, Small, Spinner } from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import type { InsightActions } from "@/lib/pixel";
import { Failure, message } from "./onboarding-ui";
import {
	type TopicConversationContext as ConversationContext,
	getTopicConversationContext,
} from "./topic-evidence-api";

interface TopicConversationContextProps {
	/** Authenticated source reader for this owner. */
	actions: InsightActions;
	/** Real imported conversation ID, selected from the evidence page. */
	threadId: string;
}

/** Transient clean-text source preview in place; opening it never opens an agent room. */
export function TopicConversationContext({
	actions,
	threadId,
}: TopicConversationContextProps) {
	const [result, setResult] = useState<{
		data: ConversationContext | null;
		error: string | null;
		actions: InsightActions;
		threadId: string;
		attempt: number;
	} | null>(null);
	const [attempt, setAttempt] = useState(0);
	const ticket = useRef(0);
	useEffect(() => {
		const request = ++ticket.current;
		const scope = { actions, threadId, attempt };
		setResult(null);
		void getTopicConversationContext(actions, threadId).then(
			(data) => {
				if (request === ticket.current)
					setResult({ data, error: null, ...scope });
			},
			(cause: unknown) => {
				if (request === ticket.current)
					setResult({ data: null, error: message(cause), ...scope });
			},
		);
		return () => {
			ticket.current += 1;
		};
	}, [actions, threadId, attempt]);
	const current =
		result?.actions === actions &&
		result.threadId === threadId &&
		result.attempt === attempt
			? result
			: null;
	if (!current)
		return (
			<output className="flex items-center gap-2 text-sm">
				<Spinner className="size-4" /> Reading recent messages…
			</output>
		);
	if (current.error)
		return (
			<Failure
				error={current.error}
				onRetry={() => setAttempt((count) => count + 1)}
			/>
		);
	const page = current.data;
	if (!page) return null;
	return (
		<div className="space-y-4">
			{page.messages.length === 0 && (
				<P className="text-sm">
					No readable messages are available in this conversation.
				</P>
			)}
			{page.messages.map((entry) => (
				<article key={entry.id} className="space-y-2 border-l-2 pl-3">
					<Small className="break-words">
						{entry.fromName ||
							entry.fromAddress ||
							"Unknown sender"}{" "}
						· {formatLocalDateTime(entry.at) || "Date unavailable"}
					</Small>
					{entry.excluded ? (
						<Muted>
							This message is excluded by your settings.
						</Muted>
					) : (
						<P className="whitespace-pre-wrap break-words text-sm">
							{entry.text || "No message text"}
						</P>
					)}
					{entry.webLink?.startsWith("https://") && (
						<Button type="button" asChild size="sm" variant="link">
							<a
								href={entry.webLink}
								target="_blank"
								rel="noreferrer"
							>
								Open in{" "}
								{page.source === "teams" ? "Teams" : "Outlook"}
							</a>
						</Button>
					)}
				</article>
			))}
			{page.hiddenCount + page.unavailableCount > 0 && (
				<P className="text-muted-foreground text-sm">
					{page.hiddenCount} hidden by your settings ·{" "}
					{page.unavailableCount} unavailable from the source
				</P>
			)}
			{page.hasMore && (
				<Muted>Showing the five most recent readable messages.</Muted>
			)}
		</div>
	);
}
