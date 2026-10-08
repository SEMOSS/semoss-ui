import { useParams } from "react-router";
import { P } from "@semoss/ui/next";
import { useEnsureThreadInsights } from "@/features/work-thread/use-thread-insights";
import { dateLabel } from "../date-label";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { BrainOverview } from "./brain-overview";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { ThreadMemory } from "./thread-memory";
import { ThreadMenu } from "./thread-menu";
import { ThreadSettings } from "./thread-settings";

/** Thread detail presents Brain's context controls, thread settings, and the thread's memories. */
export function BrainThread() {
	const { threadId } = useParams();
	const { state } = useCollaborationSession();
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	useEnsureThreadInsights(thread);
	if (!thread)
		return (
			<CollaborationSurface
				header={<CollaborationPageHeader title="Thread" />}
			>
				<P className="p-6 text-muted-foreground">
					Thread not found in this session.
				</P>
			</CollaborationSurface>
		);
	return (
		<CollaborationSurface
			header={
				<ThreadMenu thread={thread}>
					{(menu) => (
						<div>
							<CollaborationPageHeader
								title={thread.subject}
								description={thread.summary}
								actions={menu}
							>
								<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
									<span>
										{thread.channel} · {thread.messageCount}{" "}
										messages · {dateLabel(thread.lastAt)}
									</span>
								</div>
							</CollaborationPageHeader>
						</div>
					)}
				</ThreadMenu>
			}
			aside={<BrainOverview />}
			asideTitle="Brain overview"
		>
			<div className="space-y-6 p-4 md:p-6">
				<ThreadSettings thread={thread} />
				<ThreadMemory thread={thread} />
			</div>
		</CollaborationSurface>
	);
}
