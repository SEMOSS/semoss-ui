import { ChevronDown, ChevronUp, List, Search, X } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	Kbd,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import type { DependencyGraphIndex } from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";

/** The most results the list shows; the canvas still highlights every match. */
const RESULT_LIMIT = 100;

interface DependencyMapSearchProps {
	/** The network */
	index: DependencyGraphIndex;
	/** The search */
	query: string;
	/** Changes the search */
	onQueryChange: (query: string) => void;
	/** The matches, best first */
	matches: readonly string[];
	/** Centers the canvas on an item and selects it */
	onJump: (id: string) => void;
}

/**
 * Searches the map by name or id. Matches are highlighted on the canvas; Enter
 * jumps to the next one and Shift+Enter to the one before, and the results
 * list jumps to any of them. `/` focuses the search.
 */
export const DependencyMapSearch = ({
	index,
	query,
	onQueryChange,
	matches,
	onJump,
}: DependencyMapSearchProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const statusId = useId();
	const [isListOpen, setIsListOpen] = useState(false);
	// the match last jumped to, for this search; a new search starts over
	const [position, setPosition] = useState({ query, at: -1 });
	const at = position.query === query ? position.at : -1;

	useEffect(() => {
		const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
			const target = event.target;
			const isTyping =
				target instanceof HTMLElement &&
				(target.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
			if (event.key === "/" && !isTyping) {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

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
	const status = !hasQuery
		? ""
		: matches.length === 0
			? "No matches"
			: at < 0
				? `${matches.length.toLocaleString()} matches`
				: `${at + 1} of ${matches.length.toLocaleString()}`;

	const resultList = (
		<Command shouldFilter={false} label="Search results">
			<CommandList>
				<CommandEmpty>No matches</CommandEmpty>
				<CommandGroup>
					{matches.slice(0, RESULT_LIMIT).map((id, place) => {
						const node = index.nodes.get(id);
						if (!node) {
							return null;
						}
						return (
							<CommandItem
								key={id}
								value={id}
								onSelect={() => {
									setPosition({ query, at: place });
									setIsListOpen(false);
									onJump(id);
								}}
							>
								<DependencyItemImage
									node={node}
									className="size-6"
								/>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate">
										{node.name}
									</span>
									<span className="truncate text-muted-foreground text-xs">
										{
											getDependencyTypeConfig(node.type)
												.label
										}{" "}
										· {node.id}
									</span>
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
			{matches.length > RESULT_LIMIT ? (
				<p className="border-t px-3 py-2 text-muted-foreground text-xs">
					Showing the first {RESULT_LIMIT} of{" "}
					{matches.length.toLocaleString()}. Type more to narrow them.
				</p>
			) : null}
		</Command>
	);
	const shortStatus =
		matches.length === 0
			? "0"
			: `${at < 0 ? "–" : at + 1}/${matches.length.toLocaleString()}`;

	return (
		<InputGroup className="w-full min-w-0 sm:w-80">
			<InputGroupAddon>
				<Search aria-hidden="true" />
			</InputGroupAddon>
			<InputGroupInput
				ref={inputRef}
				type="search"
				aria-label="Search the map by name or id"
				aria-describedby={hasQuery ? statusId : undefined}
				placeholder="Search by name or id"
				value={query}
				onChange={(event) => onQueryChange(event.target.value)}
				onKeyDown={handleKeyDown}
			/>
			<InputGroupAddon align="inline-end">
				{hasQuery ? (
					<>
						<output
							id={statusId}
							className="text-muted-foreground text-xs"
						>
							<span aria-hidden="true">{shortStatus}</span>
							<span className="sr-only">{status}</span>
						</output>
						<Tooltip>
							<TooltipTrigger asChild>
								<InputGroupButton
									size="icon-xs"
									aria-label="Previous match"
									disabled={matches.length === 0}
									onClick={() => jumpBy(-1)}
								>
									<ChevronUp aria-hidden="true" />
								</InputGroupButton>
							</TooltipTrigger>
							<TooltipContent>
								Previous match (Shift+Enter)
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<InputGroupButton
									size="icon-xs"
									aria-label="Next match"
									disabled={matches.length === 0}
									onClick={() => jumpBy(1)}
								>
									<ChevronDown aria-hidden="true" />
								</InputGroupButton>
							</TooltipTrigger>
							<TooltipContent>Next match (Enter)</TooltipContent>
						</Tooltip>
						<Popover open={isListOpen} onOpenChange={setIsListOpen}>
							<Tooltip>
								<TooltipTrigger asChild>
									<PopoverTrigger asChild>
										<InputGroupButton
											size="icon-xs"
											aria-label="Show the matches"
											disabled={matches.length === 0}
										>
											<List aria-hidden="true" />
										</InputGroupButton>
									</PopoverTrigger>
								</TooltipTrigger>
								<TooltipContent>
									Show the matches
								</TooltipContent>
							</Tooltip>
							<PopoverContent align="end" className="w-80 p-0">
								{resultList}
							</PopoverContent>
						</Popover>
						<Tooltip>
							<TooltipTrigger asChild>
								<InputGroupButton
									size="icon-xs"
									aria-label="Clear the search"
									onClick={() => onQueryChange("")}
								>
									<X aria-hidden="true" />
								</InputGroupButton>
							</TooltipTrigger>
							<TooltipContent>Clear (Esc)</TooltipContent>
						</Tooltip>
					</>
				) : (
					<Kbd aria-hidden="true">/</Kbd>
				)}
			</InputGroupAddon>
		</InputGroup>
	);
};
