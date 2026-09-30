import { Button } from "@semoss/ui/next";
import { presentThreadMessages } from "@/features/thread-assistant/thread-context";
import { presentDraftProposal } from "@/features/thread-assistant/thread-draft-proposal";
import { presentThreadInsights } from "./thread-insights";
import { useWorkEmail } from "./work-email.context";
import { useWorkThread } from "./work-thread-context";

/** Prepare a reviewable new email from visible conversation text, excluding hidden context and reasoning. */
export function EmailConversationButton() {
	const { snapshot, title } = useWorkThread();
	const { composer } = useWorkEmail();
	const messages = presentThreadMessages(snapshot.turn.messages)
		.filter((message) => message.visible !== false)
		.map(presentDraftProposal)
		.map(presentThreadInsights);
	const body = messages
		.flatMap((message) => {
			const text = message.parts
				.flatMap((part) => (part.type === "text" ? [part.text] : []))
				.join("\n")
				.trim();
			return text
				? [`${message.role === "user" ? "You" : "Assistant"}:\n${text}`]
				: [];
		})
		.join("\n\n");
	return (
		<Button
			type="button"
			size="sm"
			variant="outline"
			disabled={
				!body || snapshot.turn.isRunning || snapshot.turn.isSubmitting
			}
			onClick={() =>
				composer.requestEmailDraft({
					id: `conversation:${snapshot.association?.roomId ?? "new"}:${snapshot.turn.messages.at(-1)?.id ?? "empty"}`,
					mode: "new",
					subject:
						title === "New session" ? "Conversation update" : title,
					body,
				})
			}
		>
			Email this conversation
		</Button>
	);
}
