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

// long snoozes re-check hourly so a sleeping laptop does not stretch one timer
const MAX_SNOOZE_WAIT_MS = 60 * 60_000;

/** When the soonest snoozed item comes back, in ms; null when nothing is snoozed. */
function nextSnoozeEnd(items: CollaborationState["items"]): number | null {
	let soonest: number | null = null;
	for (const item of items) {
		if (item.status !== "snoozed" || !item.snoozeUntil) continue;
		const at = Date.parse(item.snoozeUntil);
		if (!Number.isNaN(at) && (soonest === null || at < soonest))
			soonest = at;
	}
	return soonest;
}

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
	// wake once, when the soonest snooze is due, instead of re-running the reducer on a clock
	const nextWake = nextSnoozeEnd(state.items);
	useEffect(() => {
		if (nextWake === null) return;
		let timer: number | undefined;
		const arm = () => {
			window.clearTimeout(timer);
			const left = nextWake - Date.now();
			if (left <= 0) return dispatch({ type: "snooze.expire" });
			timer = window.setTimeout(
				arm,
				Math.min(left + 500, MAX_SNOOZE_WAIT_MS),
			);
		};
		// hidden tabs throttle timers; check again on return
		const handleVisibility = () => {
			if (document.visibilityState === "visible") arm();
		};
		arm();
		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			window.clearTimeout(timer);
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [dispatch, nextWake]);
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
