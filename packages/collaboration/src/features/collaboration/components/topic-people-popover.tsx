import { Plus, Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
	Button,
	cn,
	H3,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Small,
} from "@semoss/ui/next";
import { givenFirst } from "@/lib/person-name";
import { selectTopicIgnores } from "../state/collaboration.selectors";
import type { Person, Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";

// before a search: the people on the topic's threads, most threads first
const ON_THREADS_SHOWN = 8;
// a search lists this many; typing more narrows the rest
const RESULTS_SHOWN = 20;
// a coarse pointer gets a 44px target in this dense list
const rowButtonClassName = "pointer-coarse:min-h-11";

/** Adds people to a topic, or ignores them in it, from a search that puts the people on its threads first. */
export function TopicPeoplePopover({ topic }: { topic: Topic }) {
	const { state, dispatch } = useCollaborationSession();
	const fieldId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("");
	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setQuery("");
			setStatus("");
		}
	};

	// how many of the topic's threads each person is on; only worked out while open
	const threadCounts = new Map<string, number>();
	if (isOpen)
		for (const thread of state.threads)
			if (thread.topicLinks.some((link) => link.topicId === topic.id))
				for (const { personId } of thread.participants)
					threadCounts.set(
						personId,
						(threadCounts.get(personId) ?? 0) + 1,
					);
	const members = new Set(
		topic.people
			.filter((member) => member.state === "member")
			.map((member) => member.personId),
	);
	const ignored = new Set(
		selectTopicIgnores(state.rules, topic.id).map((rule) => rule.personId),
	);
	const text = query.trim().toLowerCase();
	const ranked = isOpen
		? state.people
				.filter(
					(person) =>
						person.isSample === topic.isSample &&
						!person.automated &&
						person.relationship !== "self" &&
						person.id !== state.profile.id &&
						!members.has(person.id) &&
						(text
							? `${person.name} ${person.email ?? ""} ${person.title}`
									.toLowerCase()
									.includes(text)
							: threadCounts.has(person.id)),
				)
				.sort(
					(a, b) =>
						(threadCounts.get(b.id) ?? 0) -
							(threadCounts.get(a.id) ?? 0) ||
						Number(b.vip) - Number(a.vip) ||
						(b.strength ?? 0) - (a.strength ?? 0) ||
						a.name.localeCompare(b.name),
				)
		: [];
	const shown = ranked.slice(0, text ? RESULTS_SHOWN : ON_THREADS_SHOWN);

	// the row goes (added) or changes (ignored), so focus goes back to the search
	const act = (message: string) => {
		setStatus(message);
		searchRef.current?.focus();
	};
	const add = (person: Person) => {
		dispatch({
			type: "topic.person",
			topicId: topic.id,
			personId: person.id,
			state: "member",
		});
		act(`Added ${givenFirst(person.name)} to this topic.`);
	};
	const ignore = (person: Person) => {
		dispatch({
			type: "rule.add",
			rule: {
				kind: "exclude_topic",
				value: "",
				topicId: topic.id,
				personId: person.id,
				isSample: topic.isSample,
			},
		});
		act(`Ignoring ${givenFirst(person.name)} in this topic.`);
	};
	const detail = (person: Person) => {
		const count = threadCounts.get(person.id) ?? 0;
		return [
			count
				? `On ${count} of its threads`
				: person.title || person.email || "",
			person.neverIngest ? "Excluded everywhere" : "",
		]
			.filter(Boolean)
			.join(" · ");
	};

	return (
		<Popover open={isOpen} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Add people"
					className="pointer-coarse:min-h-11 shrink-0 text-muted-foreground"
				>
					<Plus aria-hidden="true" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				sideOffset={8}
				collisionPadding={16}
				aria-labelledby={`${fieldId}-title`}
				aria-describedby={`${fieldId}-description`}
				className="flex max-h-(--radix-popover-content-available-height) w-96 max-w-(--radix-popover-content-available-width) flex-col overflow-hidden rounded-xl p-0"
			>
				<div className="shrink-0 space-y-4 p-5 pb-3">
					<div className="space-y-1">
						<H3
							id={`${fieldId}-title`}
							className="font-bold text-lg"
						>
							Add people
						</H3>
						<P
							id={`${fieldId}-description`}
							className="text-muted-foreground text-sm leading-relaxed"
						>
							Ignore keeps someone's messages in this topic's
							threads out of Work and the assistant.
						</P>
					</div>
					<InputGroup>
						<InputGroupAddon>
							<Search aria-hidden="true" />
						</InputGroupAddon>
						<InputGroupInput
							ref={searchRef}
							type="search"
							aria-label="Search people by name or email"
							placeholder="Search by name or email"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
						/>
					</InputGroup>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto pb-2 sm:max-h-80">
					{!text && shown.length > 0 && (
						<H4
							id={`${fieldId}-group`}
							className="px-5 pt-1 pb-1 font-medium text-muted-foreground text-xs"
						>
							On its threads
						</H4>
					)}
					{shown.length > 0 && (
						<ul
							aria-label={text ? "Matching people" : undefined}
							aria-labelledby={
								text ? undefined : `${fieldId}-group`
							}
						>
							{shown.map((person) => {
								const name = givenFirst(person.name);
								const line = detail(person);
								return (
									<li
										key={person.id}
										className="flex items-center gap-3 px-5 py-2"
									>
										<PersonAvatar
											name={person.name}
											initials={person.initials}
											email={person.email}
										/>
										<div className="min-w-0 flex-1">
											<P className="break-words font-medium text-sm leading-5">
												{name}
											</P>
											{line && (
												<Small className="block break-words font-normal text-muted-foreground text-xs leading-5">
													{line}
												</Small>
											)}
										</div>
										<div className="flex shrink-0 items-center gap-1">
											{ignored.has(person.id) ? (
												<Small className="px-2 font-normal text-muted-foreground text-xs">
													Ignored
												</Small>
											) : (
												// excluded everywhere already covers this topic
												!person.neverIngest && (
													<Button
														variant="ghost"
														size="sm"
														aria-label={`Ignore ${name} in this topic`}
														className={cn(
															rowButtonClassName,
															"font-normal text-muted-foreground",
														)}
														onClick={() =>
															ignore(person)
														}
													>
														Ignore
													</Button>
												)
											)}
											<Button
												variant="outline"
												size="sm"
												aria-label={`Add ${name} to this topic`}
												className={rowButtonClassName}
												onClick={() => add(person)}
											>
												Add
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
					{shown.length === 0 &&
						(text ? (
							<div className="space-y-2 px-5 py-3">
								<P className="text-muted-foreground text-sm">
									No one matches "{query.trim()}".
								</P>
								<Button
									variant="outline"
									size="sm"
									className={rowButtonClassName}
									onClick={() => {
										setQuery("");
										searchRef.current?.focus();
									}}
								>
									Clear search
								</Button>
							</div>
						) : (
							<P className="px-5 py-3 text-muted-foreground text-sm">
								No one else is on its threads yet. Search for
								anyone by name or email.
							</P>
						))}
					{ranked.length > shown.length && text && (
						<Small className="block px-5 pt-2 font-normal text-muted-foreground text-xs">
							Showing {shown.length} of {ranked.length}. Keep
							typing to narrow it down.
						</Small>
					)}
				</div>
				<output
					className={cn(
						"block shrink-0 border-t bg-muted/40 px-5 py-3 text-muted-foreground text-sm",
						!status && "sr-only",
					)}
				>
					{status}
				</output>
			</PopoverContent>
		</Popover>
	);
}
