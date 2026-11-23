import { personPhotoUrl } from "@/features/collaboration/api/person-photo";
import { useOptionalCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { getThreadAgent } from "@/features/thread-assistant/thread-context";

/** Who can reach a person's own Digital Twin, as its chat and its block on the Digital Twins page say it. */
export const MAIN_TWIN_PRIVACY = "Private to you";
/** What it works with, in the same two places. */
export const MAIN_TWIN_REACH =
	"Works with your mail, Teams, calendar, files, work and routines.";

/**
 * Navigation state that opens Today with its ask box ready to type in, as
 * the Chat button of a person's own Digital Twin does. Kept here, not with
 * the ask box, so a page that only links to Today does not load the composer.
 */
export const FOCUS_ASK_BOX = { focusAskBox: true };

interface MainTwinIdentity {
	/** What the twin is called; "Your Digital Twin" with no session or an older server. */
	name: string;
	/** The picture its owner chose, else their Microsoft photo, else none. */
	avatar: string | undefined;
	/** Whether the picture is one its owner chose, not their Microsoft photo standing in. */
	isSaved: boolean;
	/** The seeded agent every chat with it runs on; empty when the server names none. */
	agentId: string;
}

/** The signed-in person's own Digital Twin, as every surface names and pictures it. */
export function useMainTwin(): MainTwinIdentity {
	const state = useOptionalCollaborationSession()?.state;
	const saved = state?.mainTwin?.avatar;
	const email = state?.liveProfile?.email;
	return {
		name: state?.mainTwin?.name ?? "Your Digital Twin",
		avatar: saved || (email ? personPhotoUrl(email) : undefined),
		isSaved: Boolean(saved),
		agentId: state?.mainTwin?.agentId || getThreadAgent()?.id || "",
	};
}

interface ChatAgentInput {
	/** The agent the chat is set to; blank runs the seeded agent. */
	agentId: string;
	/** That agent once it has loaded. A new draft's is the seeded agent, under its own name. */
	agent?: { name: string } | null;
	/** The room's saved options, which mark a delegation room. */
	options?: Record<string, unknown> | null;
	/** The page is one agent's own, such as a twin's chat page, where the address names the agent. */
	isOwnPage?: boolean;
}

interface ChatAgent {
	name: string;
	/** The person's own twin's picture; none for any other agent, which keeps its own. */
	avatar: string | undefined;
	/** Whose chat it is: the person's own twin, a delegated task's agent, or any other agent. */
	kind: "mainTwin" | "delegation" | "agent";
}

/**
 * Who a chat is with. This is the one place that decides whether a chat is
 * with the person's own Digital Twin: the seeded agent runs it, the room is
 * not a delegated task's, and the page is not another agent's own.
 */
export function useChatAgent({
	agentId,
	agent,
	options,
	isOwnPage = false,
}: ChatAgentInput): ChatAgent {
	const twin = useMainTwin();
	const isSeeded = !agentId || agentId === twin.agentId;
	// As the server reads the mark (and readRoomSourceAssociation with it): a blank one is no delegation, so
	// the run is told it is the twin and the chat has to say so too.
	const delegation = options?.delegation_action_id;
	const isDelegation =
		delegation != null &&
		(typeof delegation !== "string" || delegation.trim() !== "");
	if (isSeeded && !isOwnPage && !isDelegation)
		return { name: twin.name, avatar: twin.avatar, kind: "mainTwin" };
	// The seeded agent's own name is never shown. An agent's own page starts its draft on that agent, until
	// the one its address names is applied; a delegated task's room can be saved with it.
	const seededName = isOwnPage ? "Digital Twin" : "Agent";
	return {
		name: isSeeded ? seededName : (agent?.name ?? "Agent"),
		avatar: undefined,
		kind: isDelegation ? "delegation" : "agent",
	};
}
