import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	type ConnectorErrorInfo,
	classifyConnectorError,
	runConnectorPixel,
} from "../../core/connector-pixel";
import type {
	ConnectorQuery,
	ConnectorQueryStatus,
} from "../../core/use-connector-query";
import { parseTeamsMessageSearch } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsMessageSearchPage } from "../microsoft.types";

/** How many messages each read of a search holds. */
const TEAMS_SEARCH_PAGE_SIZE = 25;

/** What {@link useTeamsMessageSearch} returns. */
export interface TeamsMessageSearch {
	/** The messages found so far, idle while nothing is searched. */
	query: ConnectorQuery<TeamsMessageSearchPage>;
	/** Reads the next page of the same search, while Microsoft holds more. */
	onShowMore?: () => void;
	/** Why the last read of a further page failed; what was found stays. */
	pageError: ConnectorErrorInfo | null;
}

/** The pages of one search read so far, and how the last read went. */
interface SearchState {
	key: string;
	data: TeamsMessageSearchPage | null;
	error: ConnectorErrorInfo | null;
	pageError: ConnectorErrorInfo | null;
	isLoading: boolean;
}

/** One search being read page by page. */
interface SearchRun {
	key: string;
	search: string;
	nextOffset: number;
	hasMore: boolean;
	isPending: boolean;
	isCancelled: boolean;
}

/**
 * Search the user's Teams chats for messages, leaving out channel posts,
 * which the channel viewer shows. Each new search, even for something
 * searched before, starts from its first page; Show More reads the next page
 * from where the last one stopped and adds it below, so the messages already
 * shown keep their places. A page that fails keeps what was found, and Show
 * More tries it again.
 *
 * @param search - What to look for, trimmed; empty reads nothing.
 * @return The messages found, the way to read further, and a failed page.
 */
export const useTeamsMessageSearch = (search: string): TeamsMessageSearch => {
	const { insightId } = useInsight();
	const key = JSON.stringify([insightId, search]);
	const [refreshId, setRefreshId] = useState(0);
	const [state, setState] = useState<SearchState>({
		key: key,
		data: null,
		error: null,
		pageError: null,
		isLoading: search !== "",
	});
	const runRef = useRef<SearchRun | null>(null);

	const readPage = useCallback(
		async (run: SearchRun): Promise<void> => {
			if (!insightId || run.isPending || run.isCancelled) {
				return;
			}
			run.isPending = true;
			const offset = run.nextOffset;
			setState((previous) => ({
				...previous,
				isLoading: true,
				pageError: null,
			}));
			try {
				const raw = await runConnectorPixel(
					MICROSOFT_PIXELS.teamsSearchMessages({
						search: run.search,
						limit: TEAMS_SEARCH_PAGE_SIZE,
						offset: offset,
						chatsOnly: true,
					}),
					insightId,
				);
				if (run.isCancelled || runRef.current !== run) {
					return;
				}
				const page = parseTeamsMessageSearch(raw);
				run.nextOffset =
					page.nextOffset ?? offset + TEAMS_SEARCH_PAGE_SIZE;
				// a page that moves no further cannot be asked for again
				run.hasMore = page.hasMore && run.nextOffset > offset;
				const hasMore = run.hasMore;
				setState((previous) => {
					const hits = new Map(
						(offset === 0 ? [] : (previous.data?.hits ?? [])).map(
							(hit) => [hit.id, hit],
						),
					);
					for (const hit of page.hits) {
						if (!hits.has(hit.id)) {
							hits.set(hit.id, hit);
						}
					}
					return {
						key: run.key,
						data: { hits: [...hits.values()], hasMore: hasMore },
						error: null,
						pageError: null,
						isLoading: false,
					};
				});
			} catch (error) {
				if (run.isCancelled || runRef.current !== run) {
					return;
				}
				const info = classifyConnectorError(error);
				setState((previous) => ({
					...previous,
					isLoading: false,
					error: previous.data === null ? info : null,
					pageError: previous.data === null ? null : info,
				}));
			} finally {
				run.isPending = false;
			}
		},
		[insightId],
	);

	// refreshId is not read: a new value starts the search again from its
	// first page even when what is searched is unchanged
	// biome-ignore lint/correctness/useExhaustiveDependencies: explicit refresh sequence
	useEffect(() => {
		if (search === "") {
			runRef.current = null;
			return;
		}
		const run: SearchRun = {
			key: key,
			search: search,
			nextOffset: 0,
			hasMore: true,
			isPending: false,
			isCancelled: false,
		};
		runRef.current = run;
		setState({
			key: key,
			data: null,
			error: null,
			pageError: null,
			isLoading: true,
		});
		void readPage(run);
		return () => {
			run.isCancelled = true;
		};
	}, [key, search, readPage, refreshId]);

	const reload = useCallback(() => {
		if (runRef.current) {
			runRef.current.isCancelled = true;
		}
		setRefreshId((previous) => previous + 1);
	}, []);
	const loadMore = useCallback(() => {
		const run = runRef.current;
		if (run && run.key === key && run.hasMore) {
			void readPage(run);
		}
	}, [key, readPage]);

	const isCurrent = search !== "" && state.key === key;
	const data = isCurrent ? state.data : null;
	const error = isCurrent ? state.error : null;
	const status: ConnectorQueryStatus =
		search === ""
			? "idle"
			: data !== null
				? "ready"
				: error
					? error.kind === "signIn"
						? "signedOut"
						: "error"
					: "loading";
	return {
		query: {
			data: data,
			error: error,
			status: status,
			isRefreshing: data !== null && state.isLoading,
			reload: reload,
		},
		onShowMore: data?.hasMore ? loadMore : undefined,
		pageError: isCurrent ? state.pageError : null,
	};
};
