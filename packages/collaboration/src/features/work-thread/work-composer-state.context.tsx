import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk/react";
import { WorkComposerSession } from "./work-composer-session";

const WorkComposerStateContext = createContext<Map<
	string,
	WorkComposerSession
> | null>(null);

/** Lives above routes and discards unsaved content when the owning app insight changes. */
export function WorkComposerStateProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { insightId } = useInsight();
	const owner = useMemo(
		() => ({ insightId, sessions: new Map<string, WorkComposerSession>() }),
		[insightId],
	);
	return (
		<WorkComposerStateContext.Provider value={owner.sessions}>
			{children}
		</WorkComposerStateContext.Provider>
	);
}

/** Isolated fallback supports embedded thread views without sharing application state. */
export function useWorkComposerSession(threadId: string): WorkComposerSession {
	const sessions = useContext(WorkComposerStateContext);
	const [local] = useState(() => new Map<string, WorkComposerSession>());
	const store = sessions ?? local;
	let session = store.get(threadId);
	if (!session) {
		session = new WorkComposerSession();
		store.set(threadId, session);
	}
	return session;
}
