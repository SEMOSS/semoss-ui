import { useState } from "react";
import {
	type ConnectorQuery,
	useConnectorQuery,
} from "../../core/use-connector-query";
import { parseTeamsMessageSearch } from "../microsoft.parsers";
import { MICROSOFT_PIXELS } from "../microsoft.pixels";
import type { TeamsMessageSearchPage } from "../microsoft.types";

/** How many messages a search reads at first, and how many more each time. */
const SEARCH_PAGE_SIZE = 25;

/** The most `MicrosoftTeamsSearchMessages` reads at once. */
const SEARCH_MAX_LIMIT = 100;

/** What {@link useTeamsMessageSearch} returns. */
export interface TeamsMessageSearch {
	/** The read of the messages found, idle while nothing is searched. */
	query: ConnectorQuery<TeamsMessageSearchPage>;
	/** Reads more of the same search, until the most one read can hold. */
	onShowMore?: () => void;
}

/**
 * Search the user's Teams chats for messages, leaving out channel posts,
 * which the channel viewer shows. A new search starts again from its first
 * page; Show More reads the same search further.
 *
 * @param search - What to look for, trimmed; empty reads nothing.
 * @return The read and the way to read further.
 */
export const useTeamsMessageSearch = (search: string): TeamsMessageSearch => {
	const [page, setPage] = useState({
		search: search,
		limit: SEARCH_PAGE_SIZE,
	});
	const limit = page.search === search ? page.limit : SEARCH_PAGE_SIZE;
	const query = useConnectorQuery(
		search
			? MICROSOFT_PIXELS.teamsSearchMessages({
					search: search,
					limit: limit,
					chatsOnly: true,
				})
			: null,
		parseTeamsMessageSearch,
		{ listKey: search },
	);

	return {
		query: query,
		onShowMore:
			limit < SEARCH_MAX_LIMIT
				? () =>
						setPage({
							search: search,
							limit: Math.min(
								limit + SEARCH_PAGE_SIZE,
								SEARCH_MAX_LIMIT,
							),
						})
				: undefined,
	};
};
