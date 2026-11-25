import { P } from "@semoss/ui/next";
import type { TwinKind } from "@/features/digital-twin/api/twin-kind";
import {
	MAIN_TWIN_PRIVACY,
	MAIN_TWIN_REACH,
} from "@/features/digital-twin/use-main-twin";

interface RoomAgentLineProps {
	/** The agent as the chat names it. */
	name: string;
	/**
	 * What the agent is to the signed-in person: their own Digital Twin, or
	 * what the twin read found. Left out for a delegated task's room, and
	 * while that read is out or has failed.
	 */
	about?: { kind: "mainTwin" } | TwinKind;
	/** The line under the chat's title, or that line in full with the sentence the chat's details add. */
	part?: "line" | "details";
}

/**
 * Who a chat is with and what that agent can reach, in the room header's
 * words: a short line under the title, which a narrow header cuts short, and
 * for the details the same line in full over a sentence. An agent nothing is
 * known about is an AI agent, with no sentence.
 */
export function RoomAgentLine({
	name,
	about,
	part = "line",
}: RoomAgentLineProps) {
	let label = "AI agent";
	let details = "";
	if (about?.kind === "mainTwin") {
		label = MAIN_TWIN_PRIVACY;
		details = `${MAIN_TWIN_PRIVACY}. ${MAIN_TWIN_REACH}`;
	} else if (about?.kind === "sharedTwin") {
		label = about.ownerName
			? `Shared by ${about.ownerName}`
			: "Shared with you";
		details =
			"It answers only from what its owner shared with it. It cannot see your mail, calendar, or files unless you bring them into this chat.";
	} else if (about?.kind === "ownTwin") {
		label = "A twin you share";
		details = "It answers only from the copies you gave it.";
	} else if (about?.kind === "agent") {
		details =
			"It can use your mail, Teams, calendar, files and work in this chat.";
	}
	const line = `${name} · ${label}`;
	if (part === "line") return <>{line}</>;
	return (
		<>
			<P className="break-words text-muted-foreground text-sm">
				{/* a person's own twin's sentence opens with its label, which is not said twice */}
				{about?.kind === "mainTwin" ? name : line}
			</P>
			{details && (
				<P className="break-words text-muted-foreground text-sm">
					{details}
				</P>
			)}
		</>
	);
}
