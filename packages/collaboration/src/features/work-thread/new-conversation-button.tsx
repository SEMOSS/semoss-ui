import { SquarePen } from "lucide-react";
import { toast } from "@semoss/ui/next";
import { WorkbenchChromeButton } from "@semoss/workbench";
import {
	canStartNewConversation,
	type ThreadSession,
} from "@/features/thread-assistant/thread-session";

/** Leave a stuck or finished room; the next message starts a new one. */
export function NewConversationButton({
	session,
	snapshot,
}: {
	session: ThreadSession;
	snapshot: ReturnType<ThreadSession["getSnapshot"]>;
}) {
	if (!canStartNewConversation(snapshot)) return null;
	return (
		<WorkbenchChromeButton
			icon={SquarePen}
			label="New conversation"
			className="pointer-coarse:size-11"
			onClick={() => startNewConversation(session)}
		/>
	);
}

export function startNewConversation(session: ThreadSession): void {
	try {
		session.startNewConversation();
		toast("New conversation. Your next message starts it.");
	} catch (cause) {
		toast.error(
			cause instanceof Error
				? cause.message
				: "Could not start a new conversation.",
		);
	}
}
