import { H3, P } from "@semoss/ui/next";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import type { RoomSource } from "../source-import/room-source";

/** Describe the imported source without claiming the assistant has already reviewed it. */
export function RoomSourceWelcome({ source }: { source: RoomSource }) {
	const collaboration = useOptionalCollaborationSession();
	const summary = collaboration?.state.threads.find(
		(thread) => thread.id === source.threadId,
	)?.summary;
	return (
		<div className="space-y-4 py-6">
			<H3 className="font-medium text-lg">
				{source.channel === "email"
					? "Work on this email"
					: source.channel === "teams"
						? "Work on this chat"
						: "Work on this conversation"}
			</H3>
			{summary && <P className="text-sm leading-relaxed">{summary}</P>}
			<P className="text-muted-foreground text-sm leading-relaxed">
				Ask a question or start with a summary, next steps, or a reply
				draft.
			</P>
		</div>
	);
}
