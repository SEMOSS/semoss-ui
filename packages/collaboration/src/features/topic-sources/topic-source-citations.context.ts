import { createContext } from "react";
import type { TopicSourceCitation } from "./topic-sources.api";

interface TopicSourceCitationsContextValue {
	citations: readonly TopicSourceCitation[];
	onOpen: (citation: TopicSourceCitation) => void;
}

/** Only server-persisted evidence can create an interactive citation. */
export const TopicSourceCitationsContext =
	createContext<TopicSourceCitationsContextValue | null>(null);

/** Turn validated markers into local links; never trust a model-generated target. */
export function formatTopicSourceCitations(
	text: string,
	citations: readonly TopicSourceCitation[],
): string {
	return text.replace(
		/\[\[source:([^\]\r\n]+)\]\]/g,
		(marker: string, id: string) => {
			const index = citations.findIndex(
				(citation) => citation.citationId === id,
			);
			return index < 0
				? marker
				: `[Source ${index + 1}](#topic-source-${encodeURIComponent(id)})`;
		},
	);
}
