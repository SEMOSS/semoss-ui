import { Check, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	H3,
	Input,
	Label,
	P,
	Spinner,
	Textarea,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import type { OnboardingPerson } from "./onboarding-api";
import { Failure, message } from "./onboarding-ui";
import type { Card } from "./topic-builder";
import {
	type FoundThreads,
	findTopicThreads,
	previewTopicReach,
	type TopicBuildDraft,
} from "./topic-builder-api";
import { TopicPeoplePicker } from "./topic-people-picker";
import type { TopicReview } from "./topic-review-api";
import { TopicSelectionSuggestions } from "./topic-selection-suggestions";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

const clueList = (text: string) =>
	[
		...new Set(
			text
				.split(/[,\n]/)
				.map((clue) => clue.trim())
				.filter(Boolean),
		),
	].slice(0, 50);

interface BuildCardProps {
	actions: InsightActions;
	review: TopicReview;
	contacts: OnboardingPerson[];
	changes: ReturnType<typeof useTopicReviewChanges>;
	isBusy: boolean;
	initial: Card;
	nextName?: string;
	otherTopics: Pick<TopicBuildDraft, "name" | "description" | "clues">[];
	onSave: () => Promise<TopicReview>;
	onSaved: () => void;
	onSkip: () => void;
}

/** What it is, who is on it, and which conversations belong. */
export function BuildCard({
	actions,
	review,
	contacts,
	changes,
	isBusy,
	initial,
	nextName,
	otherTopics,
	onSave,
	onSaved,
	onSkip,
}: BuildCardProps) {
	const id = useId();
	const [card, setCard] = useState(initial);
	const [isFinding, setIsFinding] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reach, setReach] = useState<number | null>(null);
	const asked = useRef(false);
	const heading = useRef<HTMLHeadingElement>(null);
	const [choices, setChoices] = useState(
		() =>
			new Map(
				(review.draft.corrections ?? [])
					.filter((c) => c.topicKey === initial.topicKey)
					.map((c) => [c.threadId, c.state === "include"] as const),
			),
	);
	const update = (patch: Partial<Card>) =>
		setCard((current) => ({ ...current, ...patch }));
	const peopleIds = card.people.map((p) => p.id).join(",");

	// a live count of the conversations these people are on
	useEffect(() => {
		const ids = peopleIds ? peopleIds.split(",") : [];
		if (!ids.length) {
			setReach(null);
			return;
		}
		let isCurrent = true;
		const timer = setTimeout(() => {
			previewTopicReach(actions, ids)
				.then((result) => isCurrent && setReach(result.threads))
				.catch(() => isCurrent && setReach(null));
		}, 400);
		return () => {
			isCurrent = false;
			clearTimeout(timer);
		};
	}, [actions, peopleIds]);

	const profile = {
		name: card.name.trim(),
		description: card.description,
		clues: clueList(card.clues),
		people: card.people.map((p) => p.id),
		suggestionKeys: card.suggestions.map((s) => s.key),
		otherTopics,
		...(card.topicKey ? { topicKey: card.topicKey } : {}),
	};
	const profileKey = JSON.stringify(profile);
	const [searchedProfile, setSearchedProfile] = useState("");
	const profileChanged = !!card.found && searchedProfile !== profileKey;
	const find = async (
		prepared?: Promise<FoundThreads | null>,
	): Promise<void> => {
		if (!card.name.trim() || isFinding) return;
		setIsFinding(true);
		setError(null);
		try {
			const cached = await prepared;
			const saved = await onSave();
			const found =
				cached ?? (await findTopicThreads(actions, saved, profile));
			// Other topics may have been saved while this read ran in the background.
			const claimed = new Set(
				saved.draft.topics
					.filter((t) => t.built && t.keep && t.key !== card.topicKey)
					.flatMap((t) => t.threadIds),
			);
			const threads = found.threads.filter(
				(t) => !claimed.has(t.threadId),
			);
			setSearchedProfile(profileKey);
			update({
				found: { ...found, threads },
				ticked: new Set(
					threads
						.filter(
							(t) =>
								choices.get(t.threadId) ??
								(t.preticked || card.kept.includes(t.threadId)),
						)
						.map((t) => t.threadId),
				),
			});
		} catch (cause: unknown) {
			setError(message(cause));
		} finally {
			setIsFinding(false);
		}
	};

	// the first search runs on its own once the card opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: runs once per card
	useEffect(() => {
		if (asked.current) return;
		asked.current = true;
		heading.current?.focus();
		void find(initial.prepared);
	}, []);

	const save = async (): Promise<void> => {
		if (!card.name.trim() || isSaving) return;
		setIsSaving(true);
		setError(null);
		const shown = card.found?.threads.map((t) => t.threadId) ?? [];
		const decisions = new Map(card.kept.map((id) => [id, true]));
		for (const [id, keep] of choices) decisions.set(id, keep);
		for (const id of shown) decisions.set(id, card.ticked.has(id));
		const include: string[] = [];
		const exclude: string[] = [];
		for (const [id, keep] of decisions) (keep ? include : exclude).push(id);
		if (include.length > 60 || exclude.length > 60) {
			setError(
				"A topic can save up to 60 included and 60 excluded conversations. Adjust your selection before saving.",
			);
			setIsSaving(false);
			return;
		}
		const changed = await changes.change({
			type: "build",
			...(card.topicKey ? { topicKey: card.topicKey } : {}),
			name: card.name.trim(),
			description: card.description,
			terms: clueList(card.clues).join("\n"),
			people: card.people.map((p) => p.id),
			include,
			exclude,
			fromSuggestions: card.suggestions.map((s) => s.key),
		});
		setIsSaving(false);
		if (!changed) {
			setError(
				changes.lastError() ?? "This topic did not save. Try again.",
			);
			changes.reset();
			return;
		}
		onSaved();
	};

	const answer = (option: string) => {
		const description = card.question?.descriptions?.[option];
		if (description) update({ description, question: null });
	};

	const threads = card.found?.threads ?? [];
	const names = new Map(
		[
			...contacts,
			...review.draft.topics.flatMap((topic) => [
				...topic.people,
				...topic.addedPeopleInfo,
			]),
			...card.people,
		].map((person) => [person.id, person.name]),
	);
	const locked = isBusy || isSaving;
	return (
		<section
			aria-labelledby={`${id}-heading`}
			className="space-y-5 rounded-xl border bg-background p-5"
		>
			<h2
				id={`${id}-heading`}
				tabIndex={-1}
				ref={heading}
				className="break-words font-semibold text-lg"
			>
				{initial.name}
			</h2>
			<div className="space-y-2">
				<Label
					htmlFor={`${id}-name`}
					className="text-muted-foreground text-xs"
				>
					Topic
				</Label>
				<Input
					id={`${id}-name`}
					value={card.name}
					maxLength={255}
					disabled={locked}
					onChange={(event) => update({ name: event.target.value })}
					className="font-medium text-base"
				/>
				<Label htmlFor={`${id}-about`}>What belongs</Label>
				<Textarea
					id={`${id}-about`}
					rows={2}
					value={card.description}
					maxLength={12000}
					disabled={locked}
					placeholder="What belongs here, and what does not"
					onChange={(event) =>
						update({ description: event.target.value })
					}
				/>
				<Label
					htmlFor={`${id}-clues`}
					className="text-muted-foreground text-xs"
				>
					Clues: project, product, client or system names, separated
					by commas
				</Label>
				<Input
					id={`${id}-clues`}
					value={card.clues}
					maxLength={4000}
					disabled={locked}
					onChange={(event) => update({ clues: event.target.value })}
				/>
				{card.question?.descriptions && (
					<div className="space-y-2 rounded-lg bg-primary/5 p-3">
						<P className="text-sm">{card.question.text}</P>
						<div className="flex flex-wrap gap-2">
							{card.question.options.map((option) => (
								<Button
									key={option}
									type="button"
									size="sm"
									variant="outline"
									disabled={locked}
									onClick={() => answer(option)}
								>
									{option}
								</Button>
							))}
						</div>
					</div>
				)}
			</div>
			<div className="space-y-2">
				<div className="flex flex-wrap items-baseline justify-between gap-2">
					<H3 className="text-sm">People</H3>
					{reach !== null && (
						<span className="text-muted-foreground text-xs tabular-nums">
							On {reach} conversation{reach === 1 ? "" : "s"}
						</span>
					)}
				</div>
				<div className="flex flex-wrap gap-1.5">
					{card.people.map((person) => (
						<Badge
							key={person.id}
							variant="secondary"
							title={person.reason || undefined}
							className="max-w-full whitespace-normal break-words"
						>
							{person.name}
							<button
								type="button"
								aria-label={`Take ${person.name} off this topic`}
								disabled={locked}
								className="rounded-sm hover:text-foreground"
								onClick={() =>
									update({
										people: card.people.filter(
											(p) => p.id !== person.id,
										),
									})
								}
							>
								<X aria-hidden="true" />
							</button>
						</Badge>
					))}
					{!card.people.length && (
						<P className="text-muted-foreground text-xs">
							No one yet.
						</P>
					)}
				</div>
				<details>
					<summary className="cursor-pointer py-2 font-medium text-sm">
						Add people
					</summary>
					<TopicPeoplePicker
						actions={actions}
						contacts={contacts}
						searchOnly
						taken={new Set(card.people.map((p) => p.id))}
						disabled={locked}
						onAdd={(person) =>
							update({ people: [...card.people, person] })
						}
					/>
				</details>
			</div>
			<div className="space-y-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<H3 className="text-sm">
						Conversations
						{card.found && (
							<span className="ml-2 font-normal text-muted-foreground text-xs tabular-nums">
								{card.ticked.size} of {threads.length} kept
							</span>
						)}
					</H3>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={locked || isFinding || !card.name.trim()}
						onClick={() => void find()}
					>
						{isFinding ? (
							<Spinner className="size-4" />
						) : card.found ? (
							<RotateCcw aria-hidden="true" />
						) : (
							<Search aria-hidden="true" />
						)}
						{card.found ? "Find again" : "Find conversations"}
					</Button>
				</div>
				{profileChanged && !isFinding && (
					<P className="text-muted-foreground text-sm">
						Save your edits with the current selection, or use Find
						again to look for other conversations.
					</P>
				)}
				{isFinding && !card.found && (
					<P className="flex items-center gap-2 text-muted-foreground text-sm">
						<Spinner className="size-4" /> Looking through your mail
						and chats...
					</P>
				)}
				{card.found && !threads.length && (
					<P className="text-muted-foreground text-sm">
						Nothing fits yet. Add people or clues, then find again.
					</P>
				)}
				{card.found && card.found.unchecked > 0 && (
					<P className="text-muted-foreground text-xs">
						{card.found.unchecked} conversations could not be
						checked and are left unticked.
					</P>
				)}
				{threads.length > 0 && (
					<ul className="max-h-[28rem] divide-y overflow-y-auto rounded-lg border">
						{threads.map((thread) => {
							const isKept = card.ticked.has(thread.threadId);
							return (
								<li
									key={thread.threadId}
									className="flex gap-3 px-3 py-2"
								>
									<Checkbox
										id={`${id}-${thread.threadId}`}
										checked={isKept}
										disabled={locked || isFinding}
										onCheckedChange={(checked) => {
											const ticked = new Set(card.ticked);
											if (checked === true)
												ticked.add(thread.threadId);
											else ticked.delete(thread.threadId);
											setChoices((current) =>
												new Map(current).set(
													thread.threadId,
													checked === true,
												),
											);
											update({ ticked });
										}}
										className="mt-1"
									/>
									<label
										htmlFor={`${id}-${thread.threadId}`}
										className={cn(
											"min-w-0 flex-1 space-y-0.5",
											!isKept && "opacity-70",
										)}
									>
										<span className="block break-words font-medium text-sm">
											{thread.subject}
										</span>
										<span className="block break-words text-muted-foreground text-xs">
											{[
												thread.lastAt
													? new Date(
															thread.lastAt,
														).toLocaleDateString()
													: "",
												thread.people
													.slice(0, 3)
													.map(
														(person) =>
															names.get(person) ??
															(/^p-[a-f0-9-]{6,}$/i.test(
																person,
															)
																? ""
																: person),
													)
													.filter(Boolean)
													.join(", "),
												thread.people.length > 3
													? `+${thread.people.length - 3}`
													: "",
												thread.fits === "maybe"
													? thread.reason
													: "",
											]
												.filter(Boolean)
												.join(" - ")}
										</span>
									</label>
								</li>
							);
						})}
					</ul>
				)}
			</div>
			{card.found && (
				<TopicSelectionSuggestions
					reservedClues={[
						...otherTopics.flatMap((t) => [t.name, ...t.clues]),
						...review.draft.topics
							.filter(
								(t) =>
									t.built &&
									t.keep &&
									t.key !== card.topicKey,
							)
							.flatMap((t) => [t.name, ...clueList(t.terms)]),
					]}
					card={card}
					disabled={locked || isFinding}
					onChange={update}
				/>
			)}

			{error && <Failure error={error} />}
			<div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-background py-3">
				<Button
					type="button"
					variant="ghost"
					disabled={locked}
					onClick={onSkip}
				>
					{card.topicKey ? "Close" : "Skip this one"}
				</Button>
				<Button
					type="button"
					disabled={
						locked || isFinding || !card.found || !card.name.trim()
					}
					className="h-auto max-w-full whitespace-normal py-2"
					onClick={() => void save()}
				>
					{isSaving || isFinding ? (
						<Spinner className="size-4" />
					) : (
						<Check aria-hidden="true" />
					)}
					{isFinding
						? "Finding conversations…"
						: nextName
							? `Save and continue to ${nextName}`
							: "Save topic"}
				</Button>
			</div>
			{review.draft.lastChange && (
				<output className="sr-only">{review.draft.lastChange}</output>
			)}
		</section>
	);
}
