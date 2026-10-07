import { createContext, useContext } from "react";
import type {
	Thread,
	ThreadWorkspace,
} from "@/features/collaboration/state/collaboration.types";
import type { WorkComposerSession } from "./work-composer-session";

export interface WorkEmailContextValue {
	thread: Thread;
	workspace: ThreadWorkspace;
	composer: WorkComposerSession;
	allowedSources: Set<string>;
	openEmail: (
		itemId: string,
		kind?: "source" | "tool",
		trigger?: HTMLElement,
	) => void;
}

/** Optional to keep email presentation specific to Work, including shared tool cards. */
export const WorkEmailContext = createContext<WorkEmailContextValue | null>(
	null,
);

/** Read live email content without copying it into serializable panel configuration. */
export function useWorkEmail(): WorkEmailContextValue {
	const value = useContext(WorkEmailContext);
	if (!value) throw new Error("Email panels require a Work thread.");
	return value;
}
