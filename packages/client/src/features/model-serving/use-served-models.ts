import { getErrorMessage } from "@semoss/utility/error";
import {
	getServingCapacity,
	listServedModels,
	type ServedModelList,
	type ServingCapacity,
} from "@/api/model-serving";
import { isChangingState } from "./model-serving-labels";
import { usePolledRead } from "./use-polled-read";

/** How soon the page reads again while a model is starting or stopping */
export const CHANGING_POLL_MS = 5_000;

/** How soon it reads again otherwise, to notice changes made elsewhere */
export const IDLE_POLL_MS = 30_000;

/** The served models with the capacity they share */
interface ServingSnapshot {
	list: ServedModelList;
	capacity: ServingCapacity | null;
	/** Why the capacity could not be read; the models still show */
	capacityError: string | null;
}

/** What `useServedModels` gives its page */
export interface ServedModelsResult {
	list: ServedModelList | null;
	capacity: ServingCapacity | null;
	capacityError: string | null;
	error: string | null;
	isLoading: boolean;
	isReading: boolean;
	updatedAt: Date | null;
	refresh: () => void;
}

/** Read the models and the capacity together; only the models are required. */
async function readServing(): Promise<ServingSnapshot> {
	const [list, capacity] = await Promise.allSettled([
		listServedModels(),
		getServingCapacity(),
	]);
	if (list.status === "rejected") {
		throw list.reason;
	}
	return {
		list: list.value,
		capacity: capacity.status === "fulfilled" ? capacity.value : null,
		capacityError:
			capacity.status === "rejected"
				? getErrorMessage(
						capacity.reason,
						"The capacity could not be read.",
					)
				: null,
	};
}

/** Sooner while a model is on its way somewhere. */
function nextServingRead(snapshot: ServingSnapshot | null): number {
	return snapshot?.list.servedModels.some((model) =>
		isChangingState(model.state),
	)
		? CHANGING_POLL_MS
		: IDLE_POLL_MS;
}

/**
 * The served models and the GPU and memory they share, read again every few
 * seconds while one is starting or stopping and every half minute otherwise.
 */
export function useServedModels(): ServedModelsResult {
	const { value, error, isLoading, isReading, updatedAt, refresh } =
		usePolledRead(readServing, nextServingRead);
	return {
		list: value?.list ?? null,
		capacity: value?.capacity ?? null,
		capacityError: value?.capacityError ?? null,
		error,
		isLoading,
		isReading,
		updatedAt,
		refresh,
	};
}
