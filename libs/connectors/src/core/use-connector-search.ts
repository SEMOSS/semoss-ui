import { useCallback, useEffect, useState } from "react";

/** How long typing has to pause before what is typed is searched. */
const SEARCH_DELAY_MS = 300;

/** What {@link useConnectorSearch} returns. */
export interface ConnectorSearch {
	/** What is typed in the search field. */
	text: string;
	/** Sets what is typed, as the field changes or is cleared. */
	setText: (text: string) => void;
	/**
	 * What to search for, trimmed: what was typed once typing paused, and
	 * empty at once when the field is cleared.
	 */
	searched: string;
}

/**
 * A viewer's search field and what it searches for. What is typed is searched
 * once typing pauses, so a search does not run on every key. Clearing the
 * field stops the search at once and forgets what it searched, so a search
 * typed right after never shows the results of the one before.
 *
 * @return The text typed, the way to set it, and what to search for.
 */
export const useConnectorSearch = (): ConnectorSearch => {
	const [text, setTypedText] = useState("");
	const [searched, setSearched] = useState("");
	const trimmed = text.trim();

	const setText = useCallback((value: string) => {
		setTypedText(value);
		if (value.trim() === "") {
			setSearched("");
		}
	}, []);

	useEffect(() => {
		if (trimmed === "") {
			return;
		}
		const timer = setTimeout(() => setSearched(trimmed), SEARCH_DELAY_MS);
		return () => clearTimeout(timer);
	}, [trimmed]);

	return {
		text: text,
		setText: setText,
		searched: trimmed === "" ? "" : searched,
	};
};
