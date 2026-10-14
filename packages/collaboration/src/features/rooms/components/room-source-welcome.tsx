import { FileText } from "lucide-react";
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
				Ask for a summary, help with next steps, or a reply draft.
			</P>
			<P className="flex items-start gap-2 text-muted-foreground text-xs leading-5">
				<FileText
					aria-hidden="true"
					className="mt-0.5 size-4 shrink-0"
				/>
				<span className="min-w-0 break-words">
					Source saved in this chat: {source.file.fileName}
				</span>
			</P>
		</div>
	);
}
