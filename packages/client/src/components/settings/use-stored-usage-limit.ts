import { useCallback, useEffect, useState } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import { getErrorMessage } from "@semoss/utility/error";

export interface UseStoredUsageLimitResult {
	/** The limit saved now, or null for no limit defined */
	value: ModelUsageLimit | null;
	/** Whether it is being read */
	isLoading: boolean;
	/** Why the last read failed, or null */
	error: string | null;
	/** Reads it again */
	refresh: () => void;
	/**
	 * Saves a new limit, or null to remove it, and resolves with the limit the
	 * backend saved, which becomes `value`; rejects with the reason when it is
	 * not saved
	 */
	save: (
		usageLimit: ModelUsageLimit | null,
	) => Promise<ModelUsageLimit | null>;
}

/**
 * Reads a usage limit that is not part of any grant, such as the platform
 * default or a team's total, and saves it. Reads again when `read` changes, so
 * make it with useCallback.
 *
 * @param read - reads the limit
 * @param write - saves the limit and resolves with the limit the backend saved
 * @returns the limit and the state of the read
 */
export const useStoredUsageLimit = (
	read: () => Promise<ModelUsageLimit | null>,
	write: (
		usageLimit: ModelUsageLimit | null,
	) => Promise<ModelUsageLimit | null>,
): UseStoredUsageLimitResult => {
	const [value, setValue] = useState<ModelUsageLimit | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refreshCount, setRefreshCount] = useState(0);

	useEffect(() => {
		// refreshCount is read so a refresh reads the limit again
		if (refreshCount < 0) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		setError(null);
		read()
			.then((next) => {
				if (!isStale) {
					setValue(next);
				}
			})
			.catch((e: unknown) => {
				if (!isStale) {
					setError(getErrorMessage(e, "Could not read the limit"));
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
	}, [read, refreshCount]);

	const refresh = useCallback(
		() => setRefreshCount((count) => count + 1),
		[],
	);

	const save = async (
		usageLimit: ModelUsageLimit | null,
	): Promise<ModelUsageLimit | null> => {
		// the backend's answer is what is saved now, so it is shown, not what was sent
		const saved = await write(usageLimit);
		setValue(saved);
		return saved;
	};

	return { value, isLoading, error, refresh, save };
};
