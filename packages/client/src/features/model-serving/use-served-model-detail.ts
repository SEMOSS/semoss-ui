import { useCallback } from "react";
import {
	getServedModelStatus,
	type ServedModelDetail,
} from "@/api/model-serving";
import { isChangingState } from "./model-serving-labels";
import { type PolledRead, usePolledRead } from "./use-polled-read";
import { CHANGING_POLL_MS, IDLE_POLL_MS } from "./use-served-models";

/** Sooner while the model is on its way somewhere. */
function nextDetailRead(detail: ServedModelDetail | null): number {
	return detail && isChangingState(detail.state)
		? CHANGING_POLL_MS
		: IDLE_POLL_MS;
}

/**
 * One served model's full status: its timeline, events and KServe conditions.
 * Reads nothing while `servedModel` is null, such as when its panel is closed.
 */
export function useServedModelDetail(
	servedModel: string | null,
): PolledRead<ServedModelDetail> {
	const read = useCallback(
		() => getServedModelStatus(servedModel ?? ""),
		[servedModel],
	);
	return usePolledRead(servedModel ? read : null, nextDetailRead);
}
