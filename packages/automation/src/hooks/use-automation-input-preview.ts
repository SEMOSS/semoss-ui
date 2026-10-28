import { useEffect, useRef, useState } from "react";
import {
	type AutomationInputTablePreview,
	loadAutomationInputTablePreview,
} from "../api/automation-history";

interface InputPreviewState {
	key: string;
	status: "loading" | "ready" | "empty" | "error";
	preview?: AutomationInputTablePreview;
	error?: string;
}

export interface AutomationInputPreviewState {
	preview: AutomationInputTablePreview | null;
	loading: boolean;
	error: string | null;
	empty: boolean;
	load: () => Promise<AutomationInputTablePreview | null>;
}

/** Loads historical input data on demand and ignores stale responses after the input changes. */
export function useAutomationInputPreview(
	appId: string,
	nodeId: string | undefined,
	source: string,
): AutomationInputPreviewState {
	const key = JSON.stringify([appId, nodeId, source]);
	const [state, setState] = useState<InputPreviewState | null>(null);
	const requestId = useRef(0);
	const activeKey = useRef(key);

	useEffect(() => {
		activeKey.current = key;
		return () => {
			requestId.current += 1;
		};
	}, [key]);

	const load = async (): Promise<AutomationInputTablePreview | null> => {
		if (!appId || !nodeId) return null;
		const currentRequest = ++requestId.current;
		setState({ key, status: "loading" });
		try {
			const preview = await loadAutomationInputTablePreview(
				appId,
				nodeId,
			);
			if (
				requestId.current !== currentRequest ||
				activeKey.current !== key
			) {
				return null;
			}
			setState(
				preview
					? { key, status: "ready", preview }
					: { key, status: "empty" },
			);
			return preview;
		} catch (error) {
			if (
				requestId.current !== currentRequest ||
				activeKey.current !== key
			) {
				return null;
			}
			setState({
				key,
				status: "error",
				error:
					error instanceof Error
						? error.message
						: "Unable to inspect the upstream table.",
			});
			return null;
		}
	};

	const current = state?.key === key ? state : null;
	return {
		preview: current?.preview ?? null,
		loading: current?.status === "loading",
		error: current?.error ?? null,
		empty: current?.status === "empty",
		load,
	};
}
