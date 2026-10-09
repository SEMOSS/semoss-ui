import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
} from "react";
import {
	collaborationReducer,
	reconcileCollaborationState,
} from "./collaboration.reducer";
import type {
	CollaborationCommand,
	CollaborationState,
} from "./collaboration.types";

interface CollaborationSession {
	state: CollaborationState;
	dispatch: (command: CollaborationCommand) => void;
}

/** One settled state change and the commands behind it. */
export interface CollaborationChange {
	previous: CollaborationState;
	next: CollaborationState;
	commands: CollaborationCommand[];
}

const CollaborationSessionContext = createContext<CollaborationSession | null>(
	null,
);

interface CollaborationSessionProviderProps {
	/** Application routes sharing one session. */
	children: ReactNode;
	/** Starting state: the owner's loaded data, or a fixture in tests. */
	initialState: CollaborationState;
	/** Optional observer, e.g. to save changes to a backend. */
	onChange?: (change: CollaborationChange) => void;
}

/** Shared Work/Brain state exists only for the lifetime of this application session. */
export function CollaborationSessionProvider({
	children,
	initialState,
	onChange,
}: CollaborationSessionProviderProps) {
	const [state, dispatchCommand] = useReducer(
		(
			previous: CollaborationState,
			{ command, now }: { command: CollaborationCommand; now: string },
		) => collaborationReducer(previous, command, now),
		initialState,
		reconcileCollaborationState,
	);
	const pending = useRef<CollaborationCommand[]>([]);
	const settled = useRef(state);
	const dispatch = useCallback((command: CollaborationCommand) => {
		pending.current.push(command);
		dispatchCommand({ command, now: new Date().toISOString() });
	}, []);
	useEffect(() => {
		if (state === settled.current) return;
		const change = {
			previous: settled.current,
			next: state,
			commands: pending.current,
		};
		settled.current = state;
		pending.current = [];
		onChange?.(change);
	}, [state, onChange]);
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
				state,
				dispatch,
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

/** Optional host integration for connector previews used outside the Work shell. */
export function useOptionalCollaborationSession(): CollaborationSession | null {
	return useContext(CollaborationSessionContext);
}
