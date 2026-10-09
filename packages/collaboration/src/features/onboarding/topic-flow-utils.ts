import type { ReviewTopic, TopicDraft } from "./topic-review-api";

// a middle dot, kept out of the source as a literal
export const DOT = String.fromCharCode(183);

export interface TopicPerson {
	id: string;
	name: string;
}

/** A topic's people as the owner sees them: suggested (kept or taken off) and added, each person once. */
export function topicPeople(
	evidence: ReviewTopic | undefined,
	value: TopicDraft,
	addedNames: Record<string, string>,
): { suggested: (TopicPerson & { removed: boolean })[]; added: TopicPerson[] } {
	const seen = new Set<string>();
	const suggested = (evidence?.people ?? [])
		.filter((person) => !seen.has(person.id) && !!seen.add(person.id))
		.map((person) => ({
			...person,
			removed: value.removedPeople.includes(person.id),
		}));
	const info = new Map(
		(evidence?.addedPeopleInfo ?? []).map((person) => [
			person.id,
			person.name,
		]),
	);
	const added = value.addedPeople
		.filter((id) => !seen.has(id) && !!seen.add(id))
		.map((id) => ({
			id,
			name: info.get(id) ?? addedNames[id] ?? "Someone you added",
		}));
	return { suggested, added };
}

/** "62 conversations, with A, B, C and 4 more" */
export function topicSummary(
	evidence: ReviewTopic | undefined,
	value: TopicDraft,
	addedNames: Record<string, string> = {},
): string {
	const { suggested, added } = topicPeople(evidence, value, addedNames);
	const names = [
		...suggested.filter((person) => !person.removed),
		...added,
	].map((person) => person.name);
	const count = evidence?.threadIds.length ?? 0;
	return [
		count
			? `${count} ${count === 1 ? "conversation" : "conversations"}`
			: "",
		names.length
			? `with ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}`
			: "",
	]
		.filter(Boolean)
		.join(` ${DOT} `);
}
