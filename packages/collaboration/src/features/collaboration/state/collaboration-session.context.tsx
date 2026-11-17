import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
	useState,
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
	/** Counts up each time the owner changes work (a step, an item, a build); views that show work reload when it moves. */
	workVersion: number;
	/** Says work changed. Returns the new {@link workVersion}, so the caller can tell its own change from another's. */
	markWorkChanged: () => number;
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
	// kept outside the reducer: it is a signal, not saved Work or Brain state
	const [workVersion, setWorkVersion] = useState(0);
	const latestWorkVersion = useRef(0);
	const markWorkChanged = useCallback(() => {
		latestWorkVersion.current += 1;
		setWorkVersion(latestWorkVersion.current);
		return latestWorkVersion.current;
	}, []);
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
				workVersion,
				markWorkChanged,
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

/** Seen when there is no session (isolated surfaces): nothing changes, so nothing reloads. */
const NO_WORK_SIGNAL = { workVersion: 0, markWorkChanged: () => -1 };

/**
 * The shared "work changed" signal. Mutating paths call `markWorkChanged`; views that show work reload when
 * `workVersion` moves. A view that made the change keeps the number it got back and skips that one reload.
 */
export function useWorkChanged(): Pick<
	CollaborationSession,
	"workVersion" | "markWorkChanged"
> {
	return useContext(CollaborationSessionContext) ?? NO_WORK_SIGNAL;
}
