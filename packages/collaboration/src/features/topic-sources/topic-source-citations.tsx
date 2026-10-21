import { Button, P } from "@semoss/ui/next";
import type { TopicSourceCitation } from "./topic-sources.api";

interface TopicSourceCitationsProps {
	citations: readonly TopicSourceCitation[];
	onOpen: (citation: TopicSourceCitation) => void;
}

/** Cite evidence actually referenced by the answer, retaining the version used. */
export function TopicSourceCitations({
	citations,
	onOpen,
}: TopicSourceCitationsProps) {
	if (!citations.length) return null;
	return (
		<section
			aria-label="Sources cited in this answer"
			className="space-y-2 border-t pt-3"
		>
			<P className="font-medium text-sm">Sources cited</P>
			<ol className="space-y-2">
				{citations.map((citation, index) => (
					<li
						key={`${citation.topicId}:${citation.citationId}`}
						className="min-w-0"
					>
						<Button
							variant="link"
							className="h-auto max-w-full justify-start whitespace-normal break-words p-0 text-left"
							onClick={() => onOpen(citation)}
						>
							{index + 1}. {citation.title}
						</Button>
						<P className="text-muted-foreground text-xs">
							Version {citation.version} · {citation.locator}
						</P>
					</li>
				))}
			</ol>
		</section>
	);
}
