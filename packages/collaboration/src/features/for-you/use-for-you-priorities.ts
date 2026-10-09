import { useEffect, useRef, useState } from "react";
import type { Priority } from "./for-you.model";
import {
	readForYouPriorities,
	saveForYouPriorities,
} from "./for-you-priorities";

/** An account-keyed owner shares local priority changes between mounted consumers and browser tabs. */
export function useForYouPriorities(storageKey: string): {
	priorities: Record<string, Priority>;
	error: string;
	setPriority: (id: string, priority: Priority) => void;
} {
	const [state, setState] = useState(() => readForYouPriorities(storageKey));
	const latest = useRef(state.priorities);
	useEffect(() => {
		const receive = (event: StorageEvent) => {
			if (event.key !== storageKey && event.key !== null) return;
			const next = readForYouPriorities(storageKey);
			latest.current = next.priorities;
			setState(next);
		};
		window.addEventListener("storage", receive);
		return () => window.removeEventListener("storage", receive);
	}, [storageKey]);
	return {
		...state,
		setPriority: (id, priority) => {
			const priorities = { ...latest.current, [id]: priority };
			latest.current = priorities;
			let error = "";
			try {
				saveForYouPriorities(storageKey, priorities);
			} catch {
				error =
					"Priority could not be saved in this browser. Your change will last for this session.";
			}
			setState({ priorities, error });
		},
	};
}
