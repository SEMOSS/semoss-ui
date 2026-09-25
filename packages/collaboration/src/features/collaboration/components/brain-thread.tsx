import { Link, useParams } from "react-router";
import { Button, H1, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationSurface } from "./collaboration-surface";
import { ThreadSettings } from "./thread-settings";

/** Thread detail connects Brain's context controls back to the Work room. */
export function BrainThread() {
	const { threadId } = useParams();
	const { state } = useCollaborationSession();
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	if (!thread)
		return <P className="p-6">Thread not found in this session.</P>;
	return (
		<CollaborationSurface
			aside={<BrainOverview />}
			asideTitle="Brain overview"
		>
			<div>
				<header className="space-y-3 border-b px-4 py-5 md:px-6">
					<H1 className="break-words font-semibold text-xl">
						{thread.subject}
					</H1>
					<div className="flex flex-wrap items-center gap-2">
						<Small className="font-normal text-muted-foreground text-xs">
							{thread.channel} · {thread.messageCount} messages ·{" "}
							{dateLabel(thread.lastAt)}
						</Small>
						<Button
							asChild
							variant="link"
							size="sm"
							className="h-8 px-2 text-xs"
						>
							<Link
								to={`/work/thread/${encodeURIComponent(thread.id)}`}
							>
								Open in Work
							</Link>
						</Button>
					</div>
					<P className="text-muted-foreground text-sm leading-6">
						{thread.summary}
					</P>
				</header>
				<div className="px-4 py-4 md:px-6">
					<ThreadSettings thread={thread} />
				</div>
			</div>
		</CollaborationSurface>
	);
}
