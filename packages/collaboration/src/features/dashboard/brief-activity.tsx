import { Link } from "react-router";
import { P } from "@semoss/ui/next";
import { formatDateToRelative } from "@semoss/utility/date";
import { channelMeta } from "@/features/collaboration/channel-meta";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { threadPath } from "@/lib/workspace-paths";
import { BriefPanel } from "./brief-panel";

/** How many conversations Today lists. */
const SHOWN = 5;

// shortcut: lists conversations, the only recent activity the page already holds; recent
// documents need a backend source (no reactor reads them yet), then they join this list.
/** The newest mail, chats and meetings Collaboration has read, each opening its conversation. */
export function BriefActivity() {
	const { state } = useCollaborationSession();
	const recent = state.threads
		.filter(
			(thread) =>
				!thread.muted &&
				!thread.automated &&
				(thread.channel === "email" ||
					thread.channel === "teams" ||
					thread.channel === "calendar"),
		)
		.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
		.slice(0, SHOWN);
	return (
		<BriefPanel title="Recent activity">
			{recent.length ? (
				<ul>
					{recent.map((thread) => {
						const { label, icon: Icon } = channelMeta(
							thread.channel,
						);
						return (
							<li
								key={thread.id}
								className="group relative flex items-center gap-3"
							>
								<Icon aria-hidden="true" className="size-5" />
								{/* the rule starts at the text, not under the logo */}
								<div className="flex min-w-0 flex-1 items-baseline gap-3 border-b py-3 group-last:border-b-0">
									{/* stretched over the row, so the whole row opens it */}
									<Link
										to={threadPath(thread.id)}
										title={thread.subject}
										className="min-w-0 flex-1 truncate font-medium after:absolute after:inset-0 after:rounded-lg hover:underline focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
									>
										<span className="sr-only">
											{label}:{" "}
										</span>
										{thread.subject || "No subject"}
									</Link>
									<span className="shrink-0 text-muted-foreground text-sm">
										{formatDateToRelative(thread.lastAt)}
									</span>
								</div>
							</li>
						);
					})}
				</ul>
			) : (
				<P className="text-muted-foreground text-sm">
					Nothing yet. New mail, chats and meetings show up here once
					they are read.
				</P>
			)}
		</BriefPanel>
	);
}
