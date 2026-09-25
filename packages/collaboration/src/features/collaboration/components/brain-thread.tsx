import { Link, useParams } from "react-router";
import { Badge, Button, H1, P, Small } from "@semoss/ui/next";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
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
		<CollaborationSurface>
			<div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
				<header className="space-y-3">
					<Button asChild variant="ghost" size="sm">
						<Link to="/brain/threads">Back to threads</Link>
					</Button>
					<H1 className="font-semibold text-xl">{thread.subject}</H1>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">
							{thread.isSample ? "Sample" : "Connected"}
						</Badge>
						<Small className="text-muted-foreground">
							{thread.channel} · {thread.messageCount} messages ·{" "}
							{dateLabel(thread.lastAt)}
						</Small>
					</div>
					<P className="text-muted-foreground">{thread.summary}</P>
					<Button asChild>
						<Link
							to={`/work/thread/${encodeURIComponent(thread.id)}`}
						>
							Open in Work
						</Link>
					</Button>
				</header>
				<ThreadSettings thread={thread} />
			</div>
		</CollaborationSurface>
	);
}
