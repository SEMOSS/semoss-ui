import {
	getServingGpuStatus,
	type ServingGpuStatus,
} from "@/api/model-serving";
import { usePolledRead } from "./use-polled-read";

/** How often the GPU card reads again: Prometheus scrapes DCGM every 15 s */
export const GPU_STATUS_POLL_MS = 15_000;

/** What `useServingGpuStatus` gives the GPU card */
export interface ServingGpuStatusResult {
	/** The last answer; null until the first */
	status: ServingGpuStatus | null;
	/** Why the last read failed; the last answer stays in `status` */
	error: string | null;
	isLoading: boolean;
	/** When the last answer came */
	updatedAt: Date | null;
}

/** The last hour, the window the card's sparklines show */
const readLastHour = (): Promise<ServingGpuStatus> => getServingGpuStatus("1h");

const nextGpuRead = (): number => GPU_STATUS_POLL_MS;

/**
 * The GPUs' live values and their last hour, read every 15 seconds while the
 * card is shown; a failed read keeps the last answer.
 */
export function useServingGpuStatus(): ServingGpuStatusResult {
	const { value, error, isLoading, updatedAt } = usePolledRead(
		readLastHour,
		nextGpuRead,
	);
	return { status: value, error, isLoading, updatedAt };
}
