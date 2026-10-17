import type { RoomSource } from "../source-import/room-source";
import type { ComposerPrompt } from "./room-composer.types";

/** Editable starting points for the source already queued in this chat. */
export function sourceStarterPrompts(source: RoomSource): ComposerPrompt[] {
	if (source.channel !== "email" && source.channel !== "teams") return [];
	const conversation =
		source.channel === "email" ? "email thread" : "conversation";
	return [
		{
			id: "source-summary",
			title: "Summarize",
			context: `Summarize the included ${conversation}. Focus on the key decisions and open questions.`,
		},
		{
			id: "source-next-steps",
			title: "Next steps",
			context: `What needs my attention in the included ${conversation}? Identify next steps, owners, and any explicit deadlines. Flag anything that is unclear.`,
		},
		{
			id: "source-reply",
			title: "Draft reply",
			context: `Help me draft a concise reply to the included ${conversation}. Flag any decisions or missing information you need from me. Keep it as a draft for me to review.`,
		},
	];
}
