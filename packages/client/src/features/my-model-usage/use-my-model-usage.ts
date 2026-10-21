import { useEffect, useState } from "react";
import { getMyUsageLimitPaths, type MyModelUsagePath } from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

export interface UseMyModelUsageResult {
	/** Every model the signed in person can use, with its path, or null until it is read */
	models: MyModelUsagePath[] | null;
	/** Whether a read is running */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads them again, keeping the ones shown until the read ends */
	refresh: () => void;
}

/**
 * Reads how usage limits apply to the signed in person on every model they can
 * use, in one call.
 *
 * @returns the models and the state of the read
 */
export const useMyModelUsage = (): UseMyModelUsageResult => {
	const [readCount, setReadCount] = useState(0);
	const [models, setModels] = useState<MyModelUsagePath[] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// readCount is read so a refresh reads the models again
		if (readCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		getMyUsageLimitPaths()
			.then((next) => {
				if (!isStale) {
					setModels(next);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(
						getErrorMessage(e, "Could not read your model usage"),
					);
				}
			})
			.finally(() => {
				if (!isStale) {
					setIsLoading(false);
				}
			});
		return () => {
			isStale = true;
		};
	}, [readCount]);

	return {
		models,
		isLoading,
		error,
		refresh: () => setReadCount((count) => count + 1),
	};
};
