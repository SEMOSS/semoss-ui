import { useCallback } from "react";
import {
	getServedModelLogs,
	type ServedModelContainer,
	type ServedModelLogs,
} from "@/api/model-serving";
import { type PolledRead, usePolledRead } from "./use-polled-read";

/** How often a followed log is read again */
export const FOLLOW_LOG_MS = 5_000;

/** What to read of the log, and whether to keep reading it */
export interface ServedModelLogRequest {
	container: ServedModelContainer;
	tailLines: number;
	previous: boolean;
	includeAccessLogs: boolean;
	follow: boolean;
}

const followLog = (): number => FOLLOW_LOG_MS;
const readOnce = (): null => null;

/**
 * The end of a served model's log, read again when the request changes, on
 * refresh, and every few seconds while followed. Reads nothing while
 * `servedModel` is null.
 */
export function useServedModelLogs(
	servedModel: string | null,
	{
		container,
		tailLines,
		previous,
		includeAccessLogs,
		follow,
	}: ServedModelLogRequest,
): PolledRead<ServedModelLogs> {
	const read = useCallback(
		() =>
			getServedModelLogs(servedModel ?? "", {
				container,
				tailLines,
				previous,
				includeAccessLogs,
			}),
		[servedModel, container, tailLines, previous, includeAccessLogs],
	);
	return usePolledRead(
		servedModel ? read : null,
		follow ? followLog : readOnce,
	);
}
