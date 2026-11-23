import { Search, X } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@semoss/ui/next";

interface DependencyMapSearchProps {
	/** The search */
	query: string;
	/** Changes the search */
	onQueryChange: (query: string) => void;
	/** The matches, best first */
	matches: readonly string[];
	/** Centers the canvas on an item and opens it */
	onJump: (id: string) => void;
}

/**
 * Searches a dependency graph by name or id: the admin Ontology, or an
 * item's Ontology tab. Kept simple on purpose: matches are ringed on the
 * canvas as you type, the count sits in the box, Enter goes to the next match
 * and Shift+Enter to the one before, and Escape or Clear empties it.
 */
export const DependencyMapSearch = ({
	query,
	onQueryChange,
	matches,
	onJump,
}: DependencyMapSearchProps) => {
	const statusId = useId();
	// the match last gone to, for this search; a new search starts over
	const [position, setPosition] = useState({ query, at: -1 });
	const at = position.query === query ? position.at : -1;

	const jumpBy = (step: 1 | -1): void => {
		if (matches.length === 0) {
			return;
		}
		const next =
			at < 0
				? step === 1
					? 0
					: matches.length - 1
				: (at + step + matches.length) % matches.length;
		setPosition({ query, at: next });
		onJump(matches[next]);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "Enter") {
			event.preventDefault();
			jumpBy(event.shiftKey ? -1 : 1);
		} else if (event.key === "Escape" && query) {
			event.preventDefault();
			onQueryChange("");
		}
	};

	const hasQuery = query.trim() !== "";
	const status =
		matches.length === 0
			? "No matches"
			: at < 0
				? `${matches.length.toLocaleString()} matches`
				: `${at + 1} of ${matches.length.toLocaleString()}`;

	return (
		<InputGroup className="w-full min-w-0 sm:w-80">
			<InputGroupAddon>
				<Search aria-hidden="true" />
			</InputGroupAddon>
			<InputGroupInput
				type="search"
				aria-label="Search the ontology by name or id"
				aria-describedby={hasQuery ? statusId : undefined}
				placeholder="Search by name or id"
				value={query}
				onChange={(event) => onQueryChange(event.target.value)}
				onKeyDown={handleKeyDown}
			/>
			{hasQuery ? (
				<InputGroupAddon align="inline-end">
					<output
						id={statusId}
						className="whitespace-nowrap text-muted-foreground text-xs"
					>
						{status}
					</output>
					<InputGroupButton
						size="icon-xs"
						aria-label="Clear the search"
						onClick={() => onQueryChange("")}
					>
						<X aria-hidden="true" />
					</InputGroupButton>
				</InputGroupAddon>
			) : null}
		</InputGroup>
	);
};
