import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Input,
	Kbd,
	Label,
	P,
	Small,
} from "@semoss/ui/next";
import { searchResultPath } from "../api/collaboration-search";
import { useCollaborationSearch } from "../api/use-collaboration-search";

// the shortcut listens for both keys; the hint names the one this keyboard has
const isMac =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent);

/** Searches saved Collaboration records across the owner’s workspace. */
export function CollaborationSearch() {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const searchId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const search = useCollaborationSearch(query, isOpen);
	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k" &&
				!event.repeat &&
				!event.isComposing
			) {
				event.preventDefault();
				setIsOpen(true);
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, []);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="ml-auto min-w-8 justify-start rounded-lg bg-muted/50 font-normal text-muted-foreground sm:min-w-0 sm:max-w-150 sm:flex-1"
					aria-label="Search threads, people and topics"
				>
					<Search aria-hidden="true" />
					<span className="hidden truncate sm:inline">
						Search threads, people, topics
					</span>
					<Kbd className="ml-auto hidden border border-border bg-background text-muted-foreground md:inline-flex">
						{isMac ? "⌘ K" : "Ctrl K"}
					</Kbd>
				</Button>
			</DialogTrigger>
			<DialogContent
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					inputRef.current?.focus();
				}}
			>
				<DialogHeader>
					<DialogTitle>Search your workspace</DialogTitle>
					<DialogDescription>
						Search your saved threads, people, and topics.
					</DialogDescription>
				</DialogHeader>
				<Label htmlFor={searchId}>Search</Label>
				<Input
					id={searchId}
					ref={inputRef}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Topic, person, or thread"
				/>
				<output className="text-muted-foreground text-sm">
					{!search.term
						? "Enter a name or subject to search."
						: search.status === "loading"
							? "Searching…"
							: search.status === "ready"
								? `${search.entries.length} of ${search.total} matching items`
								: ""}
				</output>
				{search.status === "error" && (
					<Alert variant="destructive">
						<AlertDescription>
							Could not search your workspace. {search.error}
							<Button
								variant="outline"
								size="sm"
								onClick={search.retry}
							>
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}
				<div
					className="max-h-80 min-h-24 overflow-auto"
					aria-busy={search.status === "loading"}
				>
					{search.entries.length > 0 && (
						<ul className="space-y-1">
							{search.entries.map((entry) => (
								<li key={`${entry.kind}:${entry.id}`}>
									<Link
										className="flex min-h-11 flex-col rounded-md px-3 py-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
										to={searchResultPath(entry)}
										onClick={() => setIsOpen(false)}
									>
										<span className="break-words">
											{entry.name}
										</span>
										<Small className="text-muted-foreground">
											{
												{
													topic: "Topic",
													person: "Person",
													thread: "Thread",
												}[entry.kind]
											}
											{entry.detail
												? ` · ${entry.detail}`
												: ""}
										</Small>
									</Link>
								</li>
							))}
						</ul>
					)}
					{search.status === "ready" && search.total === 0 && (
						<P className="py-6 text-muted-foreground">
							No matching items. Try a different name or subject.
						</P>
					)}
				</div>
				{search.hasMore && (
					<Button
						variant="outline"
						onClick={search.loadMore}
						disabled={
							search.status === "loading" ||
							search.status === "error"
						}
					>
						{search.status === "loading"
							? "Loading more…"
							: "Load more"}
					</Button>
				)}
			</DialogContent>
		</Dialog>
	);
}
