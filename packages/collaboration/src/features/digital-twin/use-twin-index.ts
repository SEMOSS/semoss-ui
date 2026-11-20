import { useCallback, useEffect, useRef } from "react";
import { useInsight } from "@semoss/sdk/react";
import { indexTwinFiles } from "./api/digital-twin";

// A pass waits this long after it is asked for, so a run of adds is described once it is over and none of
// them waits behind a pass.
const INDEX_DELAY_MS = 3000;

/**
 * Keep a twin's index of what its files hold in step with them: a moment
 * after the page has the twin, and again after each change the page reports.
 * Nothing waits on it and it never fails the page. Leaving the page drops a
 * pass that has not started; the twin's pages ask again when they next open.
 *
 * @param twinId - The owner's twin; nothing happens until there is one.
 * @returns Ask for the index to be brought up to date soon, after a change to the twin's files.
 */
export function useTwinIndex(twinId: string | undefined): () => void {
	const { actions } = useInsight();
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const request = useCallback((): void => {
		if (!twinId) return;
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			void indexTwinFiles(actions, twinId);
		}, INDEX_DELAY_MS);
	}, [actions, twinId]);
	useEffect(() => {
		// once the page has its twin: files may have changed since the index was last written
		request();
		return () => clearTimeout(timer.current);
	}, [request]);
	return request;
}
