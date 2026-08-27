import { useCallback, useEffect, useRef, useState } from "react";
import type { BrowserDebugEvent } from "../types/browserEvents";

const MAX_DEBUG_EVENTS = 1_000;

type SetDebugEnabled = (enabled: boolean, clear?: boolean) => Promise<void>;

interface UseBrowserDebugOptions {
	sessionId: string | undefined;
	onError: (message: string) => void;
	onSessionChange: () => void;
}

export function useBrowserDebug({
	sessionId,
	onError,
	onSessionChange,
}: UseBrowserDebugOptions) {
	const [debugEvents, setDebugEvents] = useState<BrowserDebugEvent[]>([]);
	const [debugDroppedCount, setDebugDroppedCount] = useState(0);
	const [debugOpen, setDebugOpen] = useState(false);
	const [debugPaused, setDebugPaused] = useState(false);
	const debugSessionIdRef = useRef<string | undefined>(undefined);
	// Filled after useBrowserSocket, which needs handleDebugEvents to be created first.
	const setDebugEnabledRef = useRef<SetDebugEnabled | null>(null);
	const onSessionChangeRef = useRef(onSessionChange);
	onSessionChangeRef.current = onSessionChange;

	const handleDebugEvents = useCallback(
		(incoming: BrowserDebugEvent[], droppedCount: number) => {
			if (incoming.length > 0) {
				setDebugEvents((current) =>
					[...current, ...incoming].slice(-MAX_DEBUG_EVENTS),
				);
			}
			if (droppedCount > 0) {
				setDebugDroppedCount((current) => current + droppedCount);
			}
		},
		[],
	);

	useEffect(() => {
		if (debugSessionIdRef.current === sessionId) return;
		debugSessionIdRef.current = sessionId;
		onSessionChangeRef.current();
		setDebugEvents([]);
		setDebugDroppedCount(0);
		setDebugOpen(false);
		setDebugPaused(false);
	}, [sessionId]);

	const bindSetDebugEnabled = useCallback((setter: SetDebugEnabled) => {
		setDebugEnabledRef.current = setter;
	}, []);

	const handleToggleDebug = useCallback(async () => {
		const nextOpen = !debugOpen;
		setDebugOpen(nextOpen);
		setDebugPaused(false);
		try {
			await setDebugEnabledRef.current?.(nextOpen);
		} catch (error) {
			setDebugOpen(!nextOpen);
			onError(
				error instanceof Error
					? error.message
					: "Could not update browser debug mode",
			);
		}
	}, [debugOpen, onError]);

	const handleToggleDebugPause = useCallback(async () => {
		const nextPaused = !debugPaused;
		setDebugPaused(nextPaused);
		try {
			await setDebugEnabledRef.current?.(!nextPaused);
		} catch (error) {
			setDebugPaused(!nextPaused);
			onError(
				error instanceof Error
					? error.message
					: "Could not update browser debug capture",
			);
		}
	}, [debugPaused, onError]);

	const handleClearDebug = useCallback(async () => {
		setDebugEvents([]);
		setDebugDroppedCount(0);
		try {
			await setDebugEnabledRef.current?.(!debugPaused, true);
		} catch (error) {
			onError(
				error instanceof Error
					? error.message
					: "Could not clear browser debug events",
			);
		}
	}, [debugPaused, onError]);

	return {
		debugEvents,
		debugDroppedCount,
		debugOpen,
		debugPaused,
		handleDebugEvents,
		bindSetDebugEnabled,
		handleToggleDebug,
		handleToggleDebugPause,
		handleClearDebug,
	};
}
