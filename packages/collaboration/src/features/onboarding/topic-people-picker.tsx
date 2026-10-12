import { Plus, Star } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Badge, Button, Input, Label, P, Spinner } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { listPeople, type OnboardingPerson } from "./onboarding-api";
import { previewTopicReach, type TopicReach } from "./topic-setup-api";

interface TopicPeoplePickerProps {
	actions: InsightActions;
	/** VIPs, followed people and strongest contacts, loaded once for the step. */
	contacts: OnboardingPerson[];
	/** People already on the topic, kept or removed. */
	taken: Set<string>;
	disabled: boolean;
	onAdd: (person: { id: string; name: string }) => void;
}

/** Add people to a topic from quick picks or a search of the owner's contacts. */
export function TopicPeoplePicker({
	actions,
	contacts,
	taken,
	disabled,
	onAdd,
}: TopicPeoplePickerProps) {
	const id = useId();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<OnboardingPerson[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const quick = contacts
		.filter((person) => !taken.has(person.id) && !person.automated)
		.slice(0, 8);

	useEffect(() => {
		const text = query.trim();
		if (text.length < 2) {
			setResults([]);
			return;
		}
		let isCurrent = true;
		setIsSearching(true);
		const timer = setTimeout(() => {
			listPeople(actions, { query: text })
				.then((people) => {
					if (isCurrent)
						setResults(people.filter((p) => !p.automated));
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
	}, [actions, query]);

	const chip = (person: OnboardingPerson) => (
		<Button
			key={person.id}
			type="button"
			variant="outline"
			size="sm"
			disabled={disabled || taken.has(person.id)}
			onClick={() => onAdd({ id: person.id, name: person.name })}
			aria-label={`Add ${person.name} to this topic`}
			className="h-auto min-h-8 max-w-full whitespace-normal"
		>
			{person.vip ? (
				<Star className="size-3 fill-current" aria-hidden="true" />
			) : (
				<Plus className="size-3" aria-hidden="true" />
			)}
			<span className="break-words">{person.name}</span>
			{person.title && (
				<span className="text-muted-foreground">
					{"\u00b7 "}
					{person.title}
				</span>
			)}
		</Button>
	);

	return (
		<div className="space-y-2">
			{quick.length > 0 && (
				<div className="space-y-1">
					<P className="text-muted-foreground text-xs">
						People you work with most
					</P>
					<div className="flex flex-wrap gap-2">
						{quick.map(chip)}
					</div>
				</div>
			)}
			<Label htmlFor={`${id}-search`} className="text-sm">
				Find someone else
			</Label>
			<Input
				id={`${id}-search`}
				value={query}
				disabled={disabled}
				placeholder="Type a name or email"
				onChange={(event) => setQuery(event.target.value)}
			/>
			{isSearching && <Spinner className="size-4" />}
			{results.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{results
						.filter((person) => !taken.has(person.id))
						.map(chip)}
				</div>
			)}
		</div>
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
				Brain also uses the name, description and clues, so not all of
				these will be filed here.
			</P>
		</div>
	);
}
