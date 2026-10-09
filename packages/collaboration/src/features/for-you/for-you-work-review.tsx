import { ExternalLink } from "lucide-react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	P,
	Skeleton,
	Small,
} from "@semoss/ui/next";
import { dateLabel } from "@/features/collaboration/date-label";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { noResponseNeeded } from "@/features/collaboration/work-item-actions";
import { safeSourceUrl } from "@/features/connectors/api/microsoft";
import { useReviewSource } from "./use-review-source";

interface ForYouWorkReviewProps {
	/** Actionable source item; reviewing does not imply a tool approval. */
	item: WorkItem;
	/** Closes the panel after a contextual resolution. */
	onResolved: () => void;
}

/** Source context is available without spinning up a new conversation. */
export function ForYouWorkReview({ item, onResolved }: ForYouWorkReviewProps) {
	const { state, dispatch } = useCollaborationSession();
	const source = useReviewSource(item.threadId);
	const thread =
		source.document?.thread ??
		state.threads.find(({ id }) => id === item.threadId);
	const draft = state.workspaces[item.threadId]?.drafts[0];
	const sourceUrl = safeSourceUrl(thread?.source?.webLink);
	return (
		<div className="space-y-6">
			{item.reasons.length > 0 && (
				<section className="space-y-2">
					<H3 className="text-sm">Why this needs you</H3>
					<P className="text-muted-foreground text-sm leading-relaxed">
						{item.reasons.join(" · ")}
					</P>
				</section>
			)}
			{thread?.summary && (
				<section className="space-y-2">
					<H3 className="text-sm">Context</H3>
					<P className="whitespace-pre-wrap break-words text-sm leading-relaxed">
						{thread.summary}
					</P>
				</section>
			)}
			{draft?.body && (
				<section className="space-y-2">
					<H3 className="text-sm">Draft reply</H3>
					<P className="whitespace-pre-wrap break-words text-sm leading-relaxed">
						{draft.body}
					</P>
				</section>
			)}
			<section className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<H3 className="text-sm">Source conversation</H3>
					{sourceUrl && (
						<Button asChild variant="link" size="sm">
							<a
								href={sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								Open source
								<ExternalLink aria-hidden="true" />
							</a>
						</Button>
					)}
				</div>
				{source.isLoading && (
					<section
						aria-label="Loading source"
						aria-busy="true"
						className="space-y-3"
					>
						<output className="sr-only">Loading source…</output>
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-28 w-full" />
					</section>
				)}
				{source.error && (
					<Alert variant="destructive">
						<AlertDescription>
							{source.error}
							<Button variant="link" onClick={source.retry}>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}
				{source.document?.limitations.map((limitation) => (
					<P
						key={limitation}
						className="text-muted-foreground text-sm"
					>
						{limitation}
					</P>
				))}
				{source.document?.messages.map((message) => (
					<article
						key={message.id}
						className="space-y-2 border-b pb-4 last:border-0"
					>
						<div className="flex flex-wrap items-baseline gap-2">
							<Small className="font-medium">
								{message.fromName ||
									message.fromAddress ||
									"Participant"}
							</Small>
							<Small className="text-muted-foreground text-xs">
								{dateLabel(message.at)}
							</Small>
						</div>
						<P className="whitespace-pre-wrap break-words text-sm leading-relaxed">
							{message.text || "No message text."}
						</P>
					</article>
				))}
				{source.document && source.document.messages.length === 0 && (
					<P className="text-muted-foreground text-sm">
						No source messages are available.
					</P>
				)}
			</section>
			<div className="flex flex-wrap justify-end gap-2 border-t pt-4">
				<Button
					variant="ghost"
					className="pointer-coarse:min-h-11"
					onClick={() => {
						noResponseNeeded(dispatch, item);
						onResolved();
					}}
				>
					Dismiss
				</Button>
				<Button
					className="pointer-coarse:min-h-11"
					onClick={() => {
						dispatch({
							type: "item.update",
							itemId: item.id,
							changes: {
								status: "done",
								...(item.suggested ? { suggested: false } : {}),
							},
						});
						onResolved();
					}}
				>
					Mark reviewed
				</Button>
			</div>
		</div>
	);
}
