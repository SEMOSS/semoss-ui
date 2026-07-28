import { useEffect } from "react";

/**
 * Fired when a notebook file's content is written from outside its own open
 * editor (e.g. the chat "Add to Notebook" action saving directly through
 * Pixel), so an already-open Notebook tab for that path can reload from disk
 * instead of silently going stale.
 */
const NOTEBOOK_FILE_REFRESH_EVENT = "semoss:notebook-file-refresh";

interface NotebookFileRefreshDetail {
	path: string;
}

export const notifyNotebookFileRefresh = (path: string): void => {
	if (typeof window === "undefined") return;
	window.dispatchEvent(
		new CustomEvent<NotebookFileRefreshDetail>(
			NOTEBOOK_FILE_REFRESH_EVENT,
			{ detail: { path } },
		),
	);
};

/** Re-runs `onRefresh` whenever `notifyNotebookFileRefresh(path)` fires for this exact path. */
export const useNotebookFileRefresh = (
	path: string,
	onRefresh: () => void,
): void => {
	useEffect(() => {
		const handleRefresh = (event: Event) => {
			const detail = (event as CustomEvent<NotebookFileRefreshDetail>)
				.detail;
			if (detail?.path === path) {
				onRefresh();
			}
		};

		window.addEventListener(NOTEBOOK_FILE_REFRESH_EVENT, handleRefresh);
		return () => {
			window.removeEventListener(
				NOTEBOOK_FILE_REFRESH_EVENT,
				handleRefresh,
			);
		};
	}, [path, onRefresh]);
};
