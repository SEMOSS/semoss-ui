import { Search, X } from "lucide-react";
import { useId } from "react";
import { Button, Input, Label } from "@semoss/ui/next";
import type { WorkFeed } from "./work-items-feed";

/** Find an item in the current status and source without leaving the work queue. */
export function WorkSearch({ feed }: { feed: WorkFeed }) {
	const fieldId = useId();
	return (
		<div className="relative w-full min-w-0 sm:w-56">
			<Label htmlFor={fieldId} className="sr-only">
				Find work
			</Label>
			<Search
				aria-hidden="true"
				className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
			/>
			<Input
				ref={feed.searchRef}
				id={fieldId}
				type="search"
				placeholder="Find work…"
				aria-describedby={`${fieldId}-hint`}
				className="pointer-coarse:min-h-11 pr-11 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
				value={feed.query}
				onChange={(event) => feed.setQuery(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Escape" && feed.query) {
						event.preventDefault();
						feed.clearSearch();
					}
				}}
			/>
			<span id={`${fieldId}-hint`} className="sr-only">
				Search titles, people, topics, and summaries in the current
				view.
			</span>
			{feed.query && (
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="-translate-y-1/2 absolute top-1/2 right-0 pointer-coarse:size-11 text-muted-foreground"
					aria-label="Clear search"
					onClick={feed.clearSearch}
				>
					<X aria-hidden="true" />
				</Button>
			)}
		</div>
	);
}
