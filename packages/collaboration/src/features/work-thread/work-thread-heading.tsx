import type { ReactNode } from "react";
import { H1 } from "@semoss/ui/next";
import { channelMeta } from "@/features/collaboration/channel-meta";
import { TopicChip } from "@/features/collaboration/components/topic-chip";
import type {
	Thread,
	Topic,
} from "@/features/collaboration/state/collaboration.types";

interface WorkThreadHeadingProps {
	/** Current source identity and topic associations. */
	thread: Thread;
	/** Loaded topics; unavailable associations are omitted. */
	topics: Topic[];
	/** Existing thread actions retain their owner and focus target. */
	children: ReactNode;
}

/** Carries the Work feed's source and topic identities into the workspace. */
export function WorkThreadHeading({
	thread,
	topics,
	children,
}: WorkThreadHeadingProps) {
	const { icon: Icon } = channelMeta(thread.channel);
	const linkedTopics = thread.topicLinks.flatMap((link) => {
		const topic = topics.find((candidate) => candidate.id === link.topicId);
		return topic ? [{ topic, suggested: link.source === "suggested" }] : [];
	});
	return (
		<div className="flex min-w-0 flex-1 items-start gap-2">
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex min-w-0 items-center gap-2">
					<span
						aria-hidden="true"
						className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
					>
						<Icon className="size-4" />
					</span>
					<H1 className="min-w-0 flex-1 break-words font-medium text-base">
						{thread.subject}
					</H1>
				</div>
				{linkedTopics.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{linkedTopics.map(({ topic, suggested }) => (
							<TopicChip
								key={topic.id}
								topic={topic}
								suggested={suggested}
							/>
						))}
					</div>
				)}
			</div>
			{children}
		</div>
	);
}
