import { useEffect, useId, useRef, useState } from "react";
import { Badge, Button, P } from "@semoss/ui/next";
import {
	PeoplePickerPanel,
	type PickerPerson,
	peoplePickerRowButtonClassName,
} from "@/features/collaboration/components/people-picker-panel";
import { givenFirst } from "@/lib/person-name";
import type { InsightActions } from "@/lib/pixel";
import { listPeople, type OnboardingPerson } from "./onboarding-api";
import { previewTopicReach, type TopicReach } from "./topic-setup-api";

// before a search: the people the owner works with most
const QUICK_SHOWN = 8;

interface TopicPeoplePickerProps {
	actions: InsightActions;
	/** VIPs, followed people and strongest contacts, loaded once for the step. */
	contacts: OnboardingPerson[];
	/** People already on the topic, kept or removed. */
	taken: Set<string>;
	disabled: boolean;
	onAdd: (person: { id: string; name: string }) => void;
}

/** Add people to a topic from the people the owner works with most, or a search of their contacts. */
export function TopicPeoplePicker({
	actions,
	contacts,
	taken,
	disabled,
	onAdd,
}: TopicPeoplePickerProps) {
	const fieldId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<OnboardingPerson[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [status, setStatus] = useState("");
	const text = query.trim();
	const pool = (text.length >= 2 ? results : contacts).filter(
		(person) => !taken.has(person.id) && !person.automated,
	);
	const shown = text.length >= 2 ? pool : pool.slice(0, QUICK_SHOWN);

	useEffect(() => {
		if (text.length < 2) {
			setResults([]);
			return;
		}
		let isCurrent = true;
		setIsSearching(true);
		const timer = setTimeout(() => {
			listPeople(actions, { query: text })
				.then((people) => {
					if (isCurrent) setResults(people);
				})
				.catch(() => {
					if (isCurrent) setResults([]);
				})
				.finally(() => {
					if (isCurrent) setIsSearching(false);
				});
		}, 250);
		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [actions, text]);

	const row = (person: OnboardingPerson): PickerPerson => ({
		id: person.id,
		name: person.name,
		email: person.email,
		detail: [person.vip ? "VIP" : "", person.title || person.email]
			.filter(Boolean)
			.join(" \u00b7 "),
	});

	return (
		<PeoplePickerPanel
			fieldId={fieldId}
			title="Add people"
			query={query}
			onQuery={setQuery}
			searchRef={searchRef}
			groupLabel="People you work with most"
			people={shown.map(row)}
			isSearching={isSearching}
			emptyText="Search for anyone by name or email."
			status={status}
			actions={(person) => (
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					aria-label={`Add ${givenFirst(person.name)} to this topic`}
					className={peoplePickerRowButtonClassName}
					onClick={() => {
						onAdd({ id: person.id, name: person.name });
						setStatus(
							`Added ${givenFirst(person.name)} to this topic.`,
						);
						searchRef.current?.focus();
					}}
				>
					Add
				</Button>
			)}
		/>
	);
}

/** Live count of conversations that involve the topic's people. */
export function TopicReachLine({
	actions,
	people,
}: {
	actions: InsightActions;
	people: string[];
}) {
	const [reach, setReach] = useState<TopicReach | null>(null);
	const key = [...people].sort().join(",");

	useEffect(() => {
		if (!key) {
			setReach(null);
			return;
		}
		let isCurrent = true;
		const timer = setTimeout(() => {
			previewTopicReach(actions, key.split(","))
				.then((value) => {
					if (isCurrent) setReach(value);
				})
				.catch(() => {
					if (isCurrent) setReach(null);
				});
		}, 400);
		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [actions, key]);

	if (!reach) return null;
	return (
		<div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
			<P>
				<output>
					{reach.threads} conversations involve these people
					{people.length > 1 && reach.together > 0
						? `, ${reach.together} with two or more of them`
						: ""}
					.
				</output>
			</P>
			{reach.samples.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{reach.samples.map((subject, index) => (
						<Badge
							key={`${index}-${subject}`}
							variant="secondary"
							className="max-w-full whitespace-normal break-words font-normal"
						>
							{subject}
						</Badge>
					))}
				</div>
			)}
			<P className="text-muted-foreground text-xs">
				The assistant also uses the name, description and clues, so not
				all of these will be filed here.
			</P>
		</div>
	);
}
