import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from "react";
import { createInitialCollaborationState } from "./collaboration.fixtures";
import {
	collaborationHistoryReducer,
	reconcileCollaborationState,
} from "./collaboration.reducer";
import type {
	CollaborationCommand,
	CollaborationState,
} from "./collaboration.types";

interface CollaborationSession {
	state: CollaborationState;
	dispatch: (command: CollaborationCommand) => void;
	undo: () => void;
	canUndo: boolean;
}

const CollaborationSessionContext = createContext<CollaborationSession | null>(
	null,
);

interface CollaborationSessionProviderProps {
	/** Application routes sharing one session. */
	children: ReactNode;
	/** Optional isolated fixture for tests. */
	initialState?: CollaborationState;
}

/** Shared Work/Brain state exists only for the lifetime of this application session. */
export function CollaborationSessionProvider({
	children,
	initialState,
}: CollaborationSessionProviderProps) {
	const [history, dispatchHistory] = useReducer(
		collaborationHistoryReducer,
		initialState,
		(value) => ({
			state: reconcileCollaborationState(
				value ?? createInitialCollaborationState(),
			),
			past: [],
		}),
	);
	const dispatch = useCallback(
		(command: CollaborationCommand) =>
			dispatchHistory({ command, now: new Date().toISOString() }),
		[],
	);
	const undo = useCallback(() => dispatchHistory({ type: "undo" }), []);
	useEffect(() => {
		const expire = () => dispatch({ type: "snooze.expire" });
		const interval = window.setInterval(expire, 30_000);
		const handleVisibility = () => {
			if (document.visibilityState === "visible") expire();
		};
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [dispatch]);
	return (
		<CollaborationSessionContext.Provider
			value={{
				state: history.state,
				dispatch,
				undo,
				canUndo: history.past.length > 0,
			}}
		>
			{children}
		</CollaborationSessionContext.Provider>
	);
}

/** Access the shared collaboration session beneath its provider. */
export function useCollaborationSession(): CollaborationSession {
	const context = useContext(CollaborationSessionContext);
	if (!context)
		throw new Error(
			"useCollaborationSession requires CollaborationSessionProvider",
		);
	return context;
}
