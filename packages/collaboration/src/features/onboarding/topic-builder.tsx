import { ArrowRight, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button, H3, Label, P, Spinner, Textarea } from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import type { OnboardingPerson } from "./onboarding-api";
import { Failure, message, StepActions } from "./onboarding-ui";
import { BuildCard } from "./topic-build-card";
import {
	type FoundThreads,
	findTopicThreads,
	startTopicBuild,
	type TopicBuildDraft,
} from "./topic-builder-api";
import type { TopicReview } from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

type Topic = TopicReview["draft"]["topics"][number];

interface Person {
	id: string;
	name: string;
	reason?: string;
}

/** One topic being set up: what it is, who is on it, and the conversations the owner keeps. */
export interface Card {
	topicKey?: string;
	line?: number;
	prepared?: Promise<FoundThreads | null>;
	name: string;
	description: string;
	clues: string;
	people: Person[];
	suggestions: { key: string; name: string }[];
	question: TopicBuildDraft["question"];
	found: FoundThreads | null;
	ticked: Set<string>;
	/** Conversations a rebuilt topic already kept, ticked again when found. */
	kept: string[];
}

interface TopicBuilderProps {
	actions: InsightActions;
	review: TopicReview;
	contacts: OnboardingPerson[];
	changes: ReturnType<typeof useTopicReviewChanges>;
	isBusy: boolean;
	/** Save the current draft and return the saved review the builder reads. */
	onSave: () => Promise<TopicReview>;
	onRemove: (key: string) => Promise<TopicReview>;
	onDone: () => void;
	onBack: () => void;
}

const fromDraft = (draft: TopicBuildDraft): Card => ({
	line: draft.line,
	name: draft.name,
	description: draft.description,
	clues: draft.clues.join(", "),
	people: draft.people,
	suggestions: draft.suggestions,
	question: draft.question,
	found: null,
	ticked: new Set(),
	kept: [],
});

// a suggestion Brain found, as a card to start from; its own profile when it stands for an area
const fromSuggestion = (topic: Topic): Card => ({
	name: topic.own?.name || topic.name,
	description: topic.description,
	clues: "",
	people: topic.people.slice(0, 8),
	suggestions: [{ key: topic.key, name: topic.own?.name || topic.name }],
	question: null,
	found: null,
	ticked: new Set(),
	kept: [],
});

const fromBuilt = (topic: Topic): Card => ({
	topicKey: topic.key,
	name: topic.name,
	description: topic.description,
	clues: topic.terms.split("\n").filter(Boolean).join(", "),
	people: [
		...topic.people.filter((p) => !topic.removedPeople.includes(p.id)),
		...topic.addedPeopleInfo,
	],
	suggestions: [],
	question: null,
	found: null,
	ticked: new Set(),
	kept: topic.threadIds,
});

/** Compare whole topic names across capitalization and punctuation used by the model. */
const topicWords = (name: string) =>
	[
		...new Set(
			name
				.normalize("NFKC")
				.toLowerCase()
				.match(/[\p{L}\p{N}+#]+/gu) ?? [],
		),
	]
		.sort()
		.join(" ");

/** Step 7: the owner sets up each topic with Brain, one at a time. */
export function TopicBuilder({
	actions,
	review,
	contacts,
	changes,
	isBusy: parentBusy,
	onSave,
	onDone,
	onRemove,
	onBack,
}: TopicBuilderProps) {
	const id = useId();
	const latestReview = useRef(review);
	const batch = useRef(0);
	const dropped = useRef(new Set<Card>());
	const [searchStatus, setSearchStatus] = useState(new Map<Card, string>());
	const [removing, setRemoving] = useState(false);
	const isBusy = parentBusy || removing;
	useEffect(() => {
		latestReview.current = review;
	}, [review]);
	useEffect(
		() => () => {
			batch.current++;
		},
		[],
	);
	const [text, setText] = useState("");
	const [isStarting, setIsStarting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [requested, setRequested] = useState<
		Pick<TopicBuildDraft, "name" | "description" | "clues">[]
	>([]);
	const [alreadyBuilt, setAlreadyBuilt] = useState<string[]>([]);
	const [queue, setQueue] = useState<Card[]>([]);
	const [card, setCard] = useState<Card | null>(null);
	const built = review.draft.topics.filter(
		(t) => t.built && t.keep && !t.mergedIntoKey,
	);
	// Brain's own groups not yet used, biggest first, to start from
	const starters = review.draft.topics
		.filter((t) => t.id && !t.built && !t.usedBy)
		.sort((a, b) => b.threadIds.length - a.threadIds.length)
		.slice(0, 6);

	const start = async (): Promise<void> => {
		const words = text.trim();
		if (!words || isStarting) return;
		setIsStarting(true);
		setError(null);
		try {
			const generation = ++batch.current;
			const saved = await onSave();
			const answer = await startTopicBuild(actions, saved, words);
			if (generation !== batch.current) return;
			const existing = saved.draft.topics.filter(
				(topic) => topic.built && topic.keep && !topic.mergedIntoKey,
			);
			const matched = new Set<string>();
			const cards = answer.topics
				.filter((draft) => {
					const name = topicWords(draft.name);
					const withClues = topicWords(
						[draft.name, ...draft.clues].join(" "),
					);
					const matches = existing.filter((topic) => {
						const savedName = topicWords(topic.name);
						return (
							savedName &&
							(savedName === name || savedName === withClues)
						);
					});
					if (matches.length !== 1) return true;
					matched.add(matches[0].name);
					return false;
				})
				.map(fromDraft);
			const profiles = answer.topics.map(
				({ name, description, clues }) => ({
					clues,
					name,
					description,
				}),
			);
			setRequested(profiles);
			setAlreadyBuilt([...matched]);
			if (!answer.topics.length) {
				setError(
					answer.reply ||
						"Brain could not identify a topic. Try a project or team name.",
				);
				return;
			}
			// Two lanes share their in-flight result with the card when it opens.
			dropped.current.clear();
			setSearchStatus(new Map());
			const lanes = [Promise.resolve(), Promise.resolve()];
			for (const [index, item] of cards.entries()) {
				const lane = index % lanes.length;
				const status = (label: string) => {
					if (
						generation === batch.current &&
						!dropped.current.has(item)
					)
						setSearchStatus((current) =>
							new Map(current).set(item, label),
						);
				};
				item.prepared = lanes[lane].then(async () => {
					if (
						generation !== batch.current ||
						dropped.current.has(item)
					)
						return null;
					status("Searching…");
					try {
						const result = await findTopicThreads(
							actions,
							latestReview.current,
							{
								name: item.name,
								description: item.description,
								clues: item.clues
									.split(",")
									.map((c) => c.trim())
									.filter(Boolean),
								people: item.people.map((p) => p.id),
								suggestionKeys: item.suggestions.map(
									(s) => s.key,
								),
								otherTopics: profiles.filter(
									(p) => p.name !== item.name,
								),
							},
						);
						status("Ready");
						return result;
					} catch {
						status("Search needs retry");
						return null;
					}
				});
				lanes[lane] = item.prepared.then(() => undefined);
			}
			setCard(cards[0] ?? null);
			setQueue(cards.slice(1));
			setText("");
		} catch (cause: unknown) {
			setError(message(cause));
		} finally {
			setIsStarting(false);
		}
	};

	const next = () => {
		setCard(queue[0] ?? null);
		setQueue(queue.slice(1));
	};

	return (
		<>
			<div className="grid min-w-0 gap-6 lg:grid-cols-[18rem_1fr]">
				<aside className="min-w-0 space-y-3">
					<H3 className="text-base">Your topics ({built.length})</H3>
					{built.length ? (
						<ul className="divide-y rounded-lg border">
							{built.map((topic) => (
								<li
									key={topic.key}
									className="grid grid-cols-[minmax(0,1fr)_auto] items-center pr-1"
								>
									<button
										type="button"
										disabled={
											isBusy || isStarting || !!card
										}
										onClick={() =>
											setCard(fromBuilt(topic))
										}
										className="flex min-w-0 flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted/50 disabled:opacity-60"
									>
										<span className="max-w-full break-words font-medium">
											{topic.name}
										</span>
										<span className="w-full text-muted-foreground text-xs tabular-nums">
											{topic.description && (
												<span
													className="block truncate text-muted-foreground"
													title={topic.description}
												>
													{topic.description}
												</span>
											)}
											{topic.threadIds.length}{" "}
											conversations
										</span>
									</button>
									{!topic.accepted && (
										<Button
											type="button"
											size="icon-sm"
											variant="ghost"
											aria-label={`Remove ${topic.name} from setup`}
											disabled={isBusy || isStarting}
											onClick={async () => {
												setRemoving(true);
												setError(null);
												try {
													await onRemove(topic.key);
													if (
														card?.topicKey ===
														topic.key
													)
														next();
													setAlreadyBuilt((names) =>
														names.filter(
															(name) =>
																name !==
																topic.name,
														),
													);
												} catch (cause) {
													setError(message(cause));
												} finally {
													setRemoving(false);
												}
											}}
										>
											<X aria-hidden="true" />
										</Button>
									)}
								</li>
							))}
						</ul>
					) : (
						<P className="text-muted-foreground text-sm">
							None yet. Each topic you set up appears here.
						</P>
					)}
					{queue.length > 0 && (
						<div className="space-y-1">
							<P className="font-medium text-sm">Up next</P>
							{queue.map((item) => (
								<div
									key={item.line}
									className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-transparent border-x pr-1"
								>
									<div className="min-w-0">
										<P className="break-words text-sm">
											{item.name}
										</P>
										<span className="text-muted-foreground text-xs">
											{searchStatus.get(item) ?? "Queued"}
										</span>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon-sm"
										aria-label={`Drop ${item.name} from queue`}
										disabled={isBusy}
										onClick={() => {
											dropped.current.add(item);
											setQueue((current) =>
												current.filter(
													(c) => c !== item,
												),
											);
											setRequested((current) =>
												current.filter(
													(p) => p.name !== item.name,
												),
											);
										}}
									>
										<X aria-hidden="true" />
									</Button>
								</div>
							))}
						</div>
					)}
				</aside>
				<div className="min-w-0 space-y-4">
					{alreadyBuilt.length > 0 && (
						<output className="text-muted-foreground text-sm">
							Already set up: {alreadyBuilt.join(", ")}
						</output>
					)}
					{card && error && <Failure error={error} />}
					{card ? (
						<BuildCard
							key={JSON.stringify([
								card.topicKey,
								card.name,
								card.line,
							])}
							actions={actions}
							review={review}
							contacts={contacts}
							changes={changes}
							isBusy={isBusy}
							initial={card}
							nextName={queue[0]?.name}
							otherTopics={requested.filter(
								(t) => t.name !== card.name,
							)}
							onSave={onSave}
							onSaved={next}
							onSkip={next}
						/>
					) : (
						<section
							aria-labelledby={`${id}-ask`}
							className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5"
						>
							<H3
								id={`${id}-ask`}
								className="flex items-center gap-2 text-base"
							>
								{built.length
									? "Add more topics"
									: "Add topics"}
							</H3>
							<P className="text-muted-foreground text-sm">
								Enter one topic per line. Include project names
								or people to help find matching conversations.
							</P>
							<Label htmlFor={`${id}-text`} className="sr-only">
								Topics to set up
							</Label>
							{isStarting ? (
								<div
									aria-live="polite"
									className="rounded-md border bg-background p-3"
								>
									<P className="font-medium text-sm">
										Preparing your topic cards
									</P>
									<ul className="mt-2 space-y-1 text-muted-foreground text-sm">
										{text
											.split("\n")
											.map((line) => line.trim())
											.filter(Boolean)
											.map((line, index) => (
												<li key={`${index}-${line}`}>
													{line}
												</li>
											))}
									</ul>
								</div>
							) : (
								<Textarea
									id={`${id}-text`}
									rows={4}
									value={text}
									maxLength={6000}
									disabled={isBusy || isStarting}
									placeholder={
										"For example:\n1. A client project and its delivery team\n2. Hiring"
									}
									onChange={(event) =>
										setText(event.target.value)
									}
								/>
							)}
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									disabled={
										isBusy || isStarting || !text.trim()
									}
									onClick={() => void start()}
								>
									{isStarting ? (
										<Spinner className="size-4" />
									) : (
										<Plus aria-hidden="true" />
									)}
									{isStarting
										? "Preparing topics…"
										: "Draft my topics"}
								</Button>
							</div>
							{!text.trim() && starters.length > 0 && (
								<details className="space-y-2">
									<summary className="cursor-pointer font-medium text-sm">
										Other suggested topics (
										{starters.length})
									</summary>
									<ul className="space-y-3">
										{starters.map((topic) => (
											<li
												key={topic.key}
												className="space-y-1"
											>
												<P className="font-medium text-sm">
													{topic.own?.name ||
														topic.name}
												</P>
												<P className="text-muted-foreground text-sm">
													{topic.threadIds.length}{" "}
													{topic.threadIds.length ===
													1
														? "conversation"
														: "conversations"}
													{topic.description &&
														` · ${topic.description}`}
												</P>
												{topic.sampleSubjects
													.slice(0, 2)
													.map((subject, index) => (
														<P
															key={`${index}-${subject}`}
															className="break-words text-muted-foreground text-xs"
														>
															{subject}
														</P>
													))}
												<Button
													type="button"
													size="sm"
													variant="outline"
													disabled={
														isBusy || isStarting
													}
													aria-label={`Review suggested topic ${topic.own?.name || topic.name}`}
													onClick={() =>
														setCard(
															fromSuggestion(
																topic,
															),
														)
													}
												>
													Review suggestion
												</Button>
											</li>
										))}
									</ul>
								</details>
							)}
							{error && (
								<Failure
									error={error}
									onRetry={
										text.trim()
											? () => void start()
											: undefined
									}
								/>
							)}
						</section>
					)}
				</div>
			</div>
			{!card && (
				<StepActions
					onBack={
						isStarting || isBusy || !!text.trim()
							? undefined
							: onBack
					}
				>
					<Button
						type="button"
						variant="outline"
						disabled={isBusy || isStarting || !!text.trim()}
						onClick={onDone}
					>
						Check topics <ArrowRight aria-hidden="true" />
					</Button>
				</StepActions>
			)}
		</>
	);
}
