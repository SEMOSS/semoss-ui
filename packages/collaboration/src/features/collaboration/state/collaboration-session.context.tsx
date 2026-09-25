import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
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

/** One settled state change: the commands behind it, or none for an undo. */
export interface CollaborationChange {
	previous: CollaborationState;
	next: CollaborationState;
	commands: CollaborationCommand[];
	undo: boolean;
}

const CollaborationSessionContext = createContext<CollaborationSession | null>(
	null,
);

interface CollaborationSessionProviderProps {
	/** Application routes sharing one session. */
	children: ReactNode;
	/** Optional isolated fixture for tests. */
	initialState?: CollaborationState;
	/** Optional observer, e.g. to save changes to a backend. */
	onChange?: (change: CollaborationChange) => void;
}

/** Shared Work/Brain state exists only for the lifetime of this application session. */
export function CollaborationSessionProvider({
	children,
	initialState,
	onChange,
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
	const pending = useRef<{ commands: CollaborationCommand[]; undo: boolean }>(
		{
			commands: [],
			undo: false,
		},
	);
	const settled = useRef(history.state);
	const dispatch = useCallback((command: CollaborationCommand) => {
		pending.current.commands.push(command);
		dispatchHistory({ command, now: new Date().toISOString() });
	}, []);
	const undo = useCallback(() => {
		pending.current.undo = true;
		dispatchHistory({ type: "undo" });
	}, []);
	useEffect(() => {
		if (history.state === settled.current) return;
		const change = {
			previous: settled.current,
			next: history.state,
			...pending.current,
		};
		settled.current = history.state;
		pending.current = { commands: [], undo: false };
		onChange?.(change);
	}, [history.state, onChange]);
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
