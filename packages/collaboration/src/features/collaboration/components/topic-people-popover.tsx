import { Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import {
	Button,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Small,
} from "@semoss/ui/next";
import { givenFirst } from "@/lib/person-name";
import { selectTopicIgnores } from "../state/collaboration.selectors";
import type { Person, Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	PeoplePickerPanel,
	peoplePickerContentClassName,
	peoplePickerRowButtonClassName,
} from "./people-picker-panel";

// before a search: the people on the topic's threads, most threads first
const ON_THREADS_SHOWN = 8;
// a search lists this many; typing more narrows the rest
const RESULTS_SHOWN = 20;

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
				className={peoplePickerContentClassName}
			>
				<PeoplePickerPanel
					fieldId={fieldId}
					title="Add people"
					description="Ignore keeps someone's messages in this topic's threads out of Work and the assistant."
					query={query}
					onQuery={setQuery}
					searchRef={searchRef}
					groupLabel="On its threads"
					people={shown.map((person) => ({
						id: person.id,
						name: person.name,
						initials: person.initials,
						email: person.email,
						detail: detail(person),
					}))}
					emptyText="No one else is on its threads yet. Search for anyone by name or email."
					hiddenCount={ranked.length - shown.length}
					status={status}
					actions={(row) => {
						const person = shown.find((item) => item.id === row.id);
						if (!person) return null;
						const name = givenFirst(person.name);
						return (
							<>
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
												peoplePickerRowButtonClassName,
												"font-normal text-muted-foreground",
											)}
											onClick={() => ignore(person)}
										>
											Ignore
										</Button>
									)
								)}
								<Button
									variant="outline"
									size="sm"
									aria-label={`Add ${name} to this topic`}
									className={peoplePickerRowButtonClassName}
									onClick={() => add(person)}
								>
									Add
								</Button>
							</>
						);
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
