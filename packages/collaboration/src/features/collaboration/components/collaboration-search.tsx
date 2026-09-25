import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router";
import {
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
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Searches loaded records without issuing mailbox queries on each keystroke. */
export function CollaborationSearch() {
	const { state } = useCollaborationSession();
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const searchId = useId();
	useEffect(() => {
		const handleKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "k") {
				event.preventDefault();
				setIsOpen((open) => !open);
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, []);
	const term = query.trim().toLowerCase();
	const results = [
		...state.topics.map((topic) => ({
			id: `topic-${topic.id}`,
			name: topic.name,
			kind: "Topic",
			path: `/brain/topics/${encodeURIComponent(topic.id)}`,
		})),
		...state.people.map((person) => ({
			id: `person-${person.id}`,
			name: person.name,
			kind: "Person",
			path: `/brain/people/${encodeURIComponent(person.id)}`,
		})),
		...state.threads.map((thread) => ({
			id: `thread-${thread.id}`,
			name: thread.subject,
			kind: thread.isSample ? "Thread" : "Connected thread",
			path: `/work/thread/${encodeURIComponent(thread.id)}`,
		})),
	]
		.filter((entry) => !term || entry.name.toLowerCase().includes(term))
		.slice(0, 30);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="min-w-8 justify-start rounded-lg bg-sidebar text-muted-foreground sm:min-w-0 sm:max-w-120 sm:flex-1"
					aria-label="Search threads, people and topics"
				>
					<Search aria-hidden="true" />
					<span className="hidden truncate sm:inline">
						Search threads, people, topics…
					</span>
					<Kbd className="ml-auto hidden border border-border bg-transparent text-muted-foreground md:inline-flex">
						⌘ K
					</Kbd>
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Search your workspace</DialogTitle>
					<DialogDescription>
						Search items already loaded in this session.
					</DialogDescription>
				</DialogHeader>
				<Label htmlFor={searchId}>Search</Label>
				<Input
					id={searchId}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Topic, person, or thread"
				/>
				<output className="sr-only">
					{results.length} matching items
				</output>
				<div className="max-h-80 overflow-auto">
					{results.length ? (
						<ul className="space-y-1">
							{results.map((entry) => (
								<li key={entry.id}>
									<Link
										className="flex min-h-11 flex-col rounded-md px-3 py-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
										to={entry.path}
										onClick={() => setIsOpen(false)}
									>
										<span className="break-words">
											{entry.name}
										</span>
										<Small className="text-muted-foreground">
											{entry.kind}
										</Small>
									</Link>
								</li>
							))}
						</ul>
					) : (
						<P className="py-6 text-muted-foreground">
							No matching items. Load email from Sources and rules
							to search more.
						</P>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
