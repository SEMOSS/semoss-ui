import { useEffect, useState } from "react";
import { useDebouncedValue } from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

/** How long typing pauses before a filter's choices are read again */
const SEARCH_DELAY_MS = 300;

export interface UseAgentRunFilterOptionsResult<T> {
	/** The choices for the search, as last read */
	options: T[];
	/** Whether the choices are being read */
	isLoading: boolean;
	/** Why the choices could not be read, or null */
	error: string | null;
}

/** The choices last read, or why they could not be */
interface ReadOptions<T> {
	options: T[];
	error: string | null;
}

/**
 * Reads a filter's choices while its list is open, and again for each search
 * once typing pauses. A read a newer search overtook is dropped.
 *
 * @param load - Reads the choices for a search; the same function each render,
 * such as a module one.
 * @param search - The text typed in the list's search box.
 * @param isOpen - Whether the list is open.
 * @returns The choices, whether they are loading, and why they failed.
 */
export const useAgentRunFilterOptions = <T>(
	load: (search: string) => Promise<T[]>,
	search: string,
	isOpen: boolean,
): UseAgentRunFilterOptionsResult<T> => {
	const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
	const [read, setRead] = useState<ReadOptions<T>>({
		options: [],
		error: null,
	});
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) {
			return;
		}
		let isStale = false;
		setIsLoading(true);
		load(debouncedSearch)
			.then((options) => {
				if (!isStale) {
					setRead({ options, error: null });
				}
			})
			.catch((error: unknown) => {
				if (!isStale) {
					setRead({
						options: [],
						error: getErrorMessage(
							error,
							"Could not load the choices",
						),
					});
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
	}, [load, debouncedSearch, isOpen]);

	return { ...read, isLoading };
};
