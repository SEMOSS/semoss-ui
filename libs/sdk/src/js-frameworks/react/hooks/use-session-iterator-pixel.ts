import { useStoreSelector } from "../utility/store-selector";
import {
	type UseIteratorPixelOptions,
	type UseIteratorPixelReturn,
	useIteratorPixel,
} from "./use-iterator-pixel";
import { useSessionStore } from "./use-session";

/**
 * Page through a pixel only in the session's existing insight, as
 * `useSessionPixel` does for a single read: a list that belongs to no
 * workspace, such as the user's rooms or agents. It waits while the
 * session's insight id is empty, and starts over when that id changes, so a
 * sign in or out never pages one user's list into another's. It ignores
 * workspace context and never creates the session's insight; the session
 * makes it when it reads the user.
 *
 * @param pixelQuery - Builds the pixel for a page from its limit and offset.
 * @param getTotalCount - Reads the total count from a response.
 * @param getData - Reads a page's items from a response.
 * @param options - Page size and callbacks.
 * @param dependencies - Values that start the list over when they change.
 * @returns The items so far and the paging state, as `useIteratorPixel`.
 */
export function useSessionIteratorPixel<TResponse, TItem>(
	pixelQuery: (limit: number, offset: number) => string,
	getTotalCount: (response: TResponse) => number,
	getData: (response: TResponse) => TItem[],
	options: Omit<UseIteratorPixelOptions<TItem>, "insightId"> = {},
	dependencies: React.DependencyList = [],
): UseIteratorPixelReturn<TItem> {
	const session = useSessionStore();
	const insightId = useStoreSelector(
		session.insight,
		(snapshot) => snapshot.insightId,
	);

	return useIteratorPixel<TResponse, TItem>(
		(limit, offset) => (insightId ? pixelQuery(limit, offset) : ""),
		getTotalCount,
		getData,
		{ ...options, insightId: insightId },
		[...dependencies, insightId],
	);
}
