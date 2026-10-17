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

interface AutomationInputPreview {
	preview: AutomationInputTablePreview | null;
	loading: boolean;
	error: string | null;
	empty: boolean;
	load: () => Promise<AutomationInputTablePreview | null>;
}

/** Loads prior output on demand and discards responses for an input that has since changed. */
export function useAutomationInputPreview(
	appId: string,
	nodeId: string | undefined,
	source: string,
): AutomationInputPreview {
	const key = JSON.stringify([appId, nodeId, source]);
	const [state, setState] = useState<InputPreviewState | null>(null);
	const request = useRef(0);
	const requestKey = useRef(key);
	useEffect(() => {
		requestKey.current = key;
		return () => {
			request.current += 1;
		};
	}, [key]);
	const load = async (): Promise<AutomationInputTablePreview | null> => {
		if (!appId || !nodeId) return null;
		const requestId = ++request.current;
		setState({ key, status: "loading" });
		try {
			const preview = await loadAutomationInputTablePreview(
				appId,
				nodeId,
			);
			if (request.current !== requestId || requestKey.current !== key)
				return null;
			setState(
				preview
					? { key, status: "ready", preview }
					: { key, status: "empty" },
			);
			return preview;
		} catch (error) {
			if (request.current !== requestId || requestKey.current !== key)
				return null;
			setState({
				key,
				status: "error",
				error:
					error instanceof Error
						? error.message
						: "Unable to load upstream table output.",
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
