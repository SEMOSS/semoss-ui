import type { Session } from "@/types/session";

export function selectMostRecentRoom(sessions: Session[], agentId: string) {
	return sessions
		.filter((session) => session.agentId === agentId)
		.reduce<Session | undefined>((latest, session) => {
			if (!latest) return session;
			return Date.parse(session.updatedAt) > Date.parse(latest.updatedAt)
				? session
				: latest;
		}, undefined);
}
