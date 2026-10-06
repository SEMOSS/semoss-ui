import { ChevronDown, ChevronUp, X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Input, Label, Small } from "@semoss/ui/next";
import { WorkbenchChromeButton } from "@semoss/workbench";
import type { PaneSearch as PaneSearchState } from "./use-pane-search";

/** Compact find controls shared by the Emails and Context panes. */
export function PaneSearch({
	search,
	label,
	children,
}: {
	search: PaneSearchState;
	label: string;
	/** Related pane controls share the search row and wrap together when needed. */
	children?: ReactNode;
}) {
	const id = useId();
	return (
		<div className="flex shrink-0 flex-wrap items-center gap-2 border-border border-b p-2">
			<div className="flex min-w-0 flex-1 basis-48 flex-wrap items-center gap-1">
				<Label htmlFor={id} className="sr-only">
					{label}
				</Label>
				<Input
					id={id}
					type="search"
					placeholder={label}
					value={search.query}
					className="h-8 pointer-coarse:h-11 min-w-0 flex-1 basis-24"
					onChange={(event) => search.setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							search.navigate(event.shiftKey ? -1 : 1);
						}
						if (event.key === "Escape") {
							event.stopPropagation();
							search.setQuery("");
						}
					}}
				/>
				{search.query && (
					<div className="flex shrink-0 items-center gap-1">
						<output>
							<Small className="text-muted-foreground">
								{search.count
									? `${search.position} / ${search.count}`
									: "No matches"}
							</Small>
						</output>
						<WorkbenchChromeButton
							icon={ChevronUp}
							label={`Previous match: ${label}`}
							className="pointer-coarse:size-11"
							disabled={!search.count}
							onClick={() => search.navigate(-1)}
						/>
						<WorkbenchChromeButton
							icon={ChevronDown}
							label={`Next match: ${label}`}
							className="pointer-coarse:size-11"
							disabled={!search.count}
							onClick={() => search.navigate(1)}
						/>
						<WorkbenchChromeButton
							icon={X}
							label={`Clear ${label.toLowerCase()}`}
							className="pointer-coarse:size-11"
							onClick={() => search.setQuery("")}
						/>
					</div>
				)}
			</div>
			{children}
		</div>
	);
}
