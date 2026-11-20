import { Button, H3, P } from "@semoss/ui/next";
import type { Card } from "./topic-builder";

/** Owner-confirmed profile changes supported by the currently selected search results. */
export function TopicSelectionSuggestions({
	card,
	reservedClues,
	disabled,
	onChange,
}: {
	card: Card;
	reservedClues: string[];
	disabled: boolean;
	onChange: (change: Partial<Card>) => void;
}) {
	const selected =
		card.found?.threads.filter((t) => card.ticked.has(t.threadId)) ?? [];
	if (!selected.length) return null;
	const people = new Map<
		string,
		{ id: string; name: string; count: number }
	>();
	const clues = new Map<string, { name: string; count: number }>();
	// A subject can legitimately mention two projects. A recurring name already owned
	// by another card must not expand this topic's filing scope.
	const words = (value: string) =>
		value
			.normalize("NFKC")
			.toLowerCase()
			.replace(/[^\p{L}\p{N}+#]+/gu, " ")
			.trim();
	const reserved = reservedClues.map((value) => ` ${words(value)} `);
	const currentClues = new Set(
		[card.name, ...card.clues.split(/[,\n]/)].map(words),
	);
	for (const thread of selected) {
		for (const person of thread.participants ?? []) {
			people.set(person.id, {
				...person,
				count: (people.get(person.id)?.count ?? 0) + 1,
			});
		}
		const seen = new Set<string>();
		for (const name of thread.subjectClues ?? []) {
			const key = words(name);
			if (
				seen.has(key) ||
				currentClues.has(key) ||
				reserved.some((term) => term.includes(` ${key} `))
			)
				continue;
			seen.add(key);
			clues.set(key, { name, count: (clues.get(key)?.count ?? 0) + 1 });
		}
	}
	const suggested = [...people.values()]
		.filter((p) => p.count >= 2 && !card.people.some((c) => c.id === p.id))
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);
	const unused = selected.every((t) => t.participants !== undefined)
		? card.people.filter((p) => !people.has(p.id))
		: [];
	const keywords = [...clues.values()]
		.filter((c) => c.count >= 2)
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);
	if (!suggested.length && !unused.length && !keywords.length) return null;
	return (
		<section className="space-y-2">
			<H3 className="text-sm">
				Suggestions from the {selected.length} selected{" "}
				{selected.length === 1 ? "conversation" : "conversations"}
			</H3>
			<P className="text-muted-foreground text-xs">
				Choose which changes to add to this topic.
			</P>
			<div className="flex flex-wrap gap-2">
				{suggested.map((p) => (
					<Button
						key={p.id}
						type="button"
						size="sm"
						variant="outline"
						disabled={disabled || card.people.length >= 60}
						onClick={() =>
							onChange({
								people: [
									...card.people,
									{ id: p.id, name: p.name },
								],
							})
						}
					>
						Add {p.name} ({p.count})
					</Button>
				))}
				{unused.map((p) => (
					<Button
						key={p.id}
						type="button"
						size="sm"
						variant="outline"
						disabled={disabled}
						onClick={() =>
							onChange({
								people: card.people.filter(
									(person) => person.id !== p.id,
								),
							})
						}
					>
						Remove {p.name} (0)
					</Button>
				))}
				{keywords.map((c) => (
					<Button
						key={c.name}
						type="button"
						size="sm"
						variant="outline"
						disabled={disabled}
						onClick={() =>
							onChange({
								clues: [card.clues.trim(), c.name]
									.filter(Boolean)
									.join(", "),
							})
						}
					>
						Add clue “{c.name}” ({c.count})
					</Button>
				))}
			</div>
		</section>
	);
}
