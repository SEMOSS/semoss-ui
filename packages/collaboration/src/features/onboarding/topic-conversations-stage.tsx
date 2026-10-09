import {
	ArrowLeft,
	ArrowRight,
	CornerDownRight,
	MessagesSquare,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	P,
	Spinner,
} from "@semoss/ui/next";
import type { InsightActions } from "@/lib/pixel";
import { Failure, message } from "./onboarding-ui";
import {
	getTopicEvidence,
	type TopicEvidenceItem,
	type TopicReviewChange,
} from "./topic-evidence-api";
import { DOT } from "./topic-flow-utils";
import type { TopicReview, TopicReviewDraft } from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

// corrections go in batches the server accepts
const BATCH = 50;
// conversations on screen at first, and per Show more
const PAGE = 10;

interface TopicConversationsStageProps {
	actions: InsightActions;
	review: TopicReview;
	values: TopicReviewDraft;
	/** Kept topics, in the order the owner saw them. */
	keys: string[];
	isBusy: boolean;
	changes: ReturnType<typeof useTopicReviewChanges>;
	/** Save the draft so the conversations are read for its latest revision. */
	onSave: () => Promise<TopicReview>;
	onDone: () => void;
	/** The step's action bar, where this step puts its own buttons. */
	navSlot: HTMLElement | null;
}

/** One topic at a time: what is checked belongs, what is unchecked does not, a move sends it elsewhere. */
export function TopicConversationsStage({
	actions,
	review,
	values,
	keys,
	isBusy,
	changes,
	onSave,
	onDone,
	navSlot,
}: TopicConversationsStageProps) {
	const listId = useId();
	const [index, setIndex] = useState(0);
	const [items, setItems] = useState<TopicEvidenceItem[]>([]);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [shown, setShown] = useState(PAGE);
	const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
	const [moved, setMoved] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const latest = useRef(review);
	latest.current = review;
	const key = keys[Math.min(index, keys.length - 1)] ?? "";
	const value = values.topics.find((topic) => topic.key === key);
	const others = keys
		.filter((other) => other !== key)
		.map((other) => ({
			key: other,
			name:
				values.topics.find((topic) => topic.key === other)?.name ||
				"New topic",
		}));
	const corrections = review.draft.corrections ?? [];
	const stateOf = (threadId: string) =>
		corrections.find(
			(item) => item.threadId === threadId && item.topicKey === key,
		)?.state;

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload only when the topic changes
	useEffect(() => {
		if (!key) return;
		let isCurrent = true;
		setIsLoading(true);
		setError(null);
		setItems([]);
		setShown(PAGE);
		setMoved({});
		onSave()
			.then((saved) => getTopicEvidence(actions, saved, key))
			.then((page) => {
				if (!isCurrent) return;
				setItems(page.items);
				setTotal(page.total);
				setHasMore(page.hasMore);
				const draft = latest.current.draft.corrections ?? [];
				setUnchecked(
					new Set(
						page.items
							.filter((item) =>
								draft.some(
									(row) =>
										row.threadId === item.id &&
										row.topicKey === key &&
										row.state === "exclude",
								),
							)
							.map((item) => item.id),
					),
				);
			})
			.catch((cause: unknown) => {
				if (isCurrent) setError(message(cause));
			})
			.finally(() => {
				if (isCurrent) setIsLoading(false);
			});
		return () => {
			isCurrent = false;
		};
	}, [actions, key]);

	if (keys.length === 0)
		return (
			<P className="rounded-lg border p-4 text-muted-foreground text-sm">
				No topics are kept yet. Go back and keep at least one.
			</P>
		);

	const showMore = async (): Promise<void> => {
		if (shown < items.length) {
			setShown((current) => current + PAGE);
			return;
		}
		setIsLoading(true);
		try {
			const page = await getTopicEvidence(
				actions,
				latest.current,
				key,
				"",
				items.length,
			);
			setItems((current) => [...current, ...page.items]);
			setHasMore(page.hasMore);
			setShown((current) => current + PAGE);
		} catch (cause: unknown) {
			setError(message(cause));
		} finally {
			setIsLoading(false);
		}
	};

	const send = async (
		type: "confirm" | "reject",
		rows: TopicEvidenceItem[],
	): Promise<boolean> => {
		for (let start = 0; start < rows.length; start += BATCH) {
			const part = rows.slice(start, start + BATCH);
			const change: TopicReviewChange = {
				type,
				topicKey: key,
				threadIds: part.map((row) => row.id),
				versions: Object.fromEntries(
					part.map((row) => [row.id, row.version]),
				),
			};
			if (!(await changes.change(change))) return false;
		}
		return true;
	};

	// what the owner looked at is recorded: checked ones belong, unchecked ones do not
	const advance = async (step: 1 | -1): Promise<void> => {
		setIsSending(true);
		try {
			const open = items
				.slice(0, shown)
				.filter((item) => item.canCorrect && !moved[item.id]);
			const rejects = open.filter(
				(item) =>
					unchecked.has(item.id) && stateOf(item.id) !== "exclude",
			);
			const confirms = open.filter(
				(item) =>
					!unchecked.has(item.id) && stateOf(item.id) !== "include",
			);
			if (
				!(await send("reject", rejects)) ||
				!(await send("confirm", confirms))
			)
				return;
		} finally {
			setIsSending(false);
		}
		if (step === 1 && index >= keys.length - 1) onDone();
		else setIndex((current) => Math.max(0, current + step));
	};

	const move = async (
		item: TopicEvidenceItem,
		target: { key: string; name: string },
	) => {
		const saved = await changes.change({
			type: "move",
			topicKey: key,
			targetKey: target.key,
			threadIds: [item.id],
			versions: { [item.id]: item.version },
		});
		if (saved)
			setMoved((current) => ({ ...current, [item.id]: target.name }));
	};

	const busy = isBusy || isSending || isLoading;
	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<P className="font-medium">
					{value?.name || "New topic"}
					<span className="font-normal text-muted-foreground">
						{` ${DOT} ${total} ${total === 1 ? "conversation" : "conversations"}`}
					</span>
				</P>
				<P className="text-muted-foreground text-sm">
					Topic {Math.min(index, keys.length - 1) + 1} of{" "}
					{keys.length}
				</P>
			</div>
			{error && <Failure error={error} />}
			{isLoading && items.length === 0 ? (
				<P className="flex items-center gap-2 text-muted-foreground text-sm">
					<Spinner className="size-4" /> Loading conversations...
				</P>
			) : items.length === 0 ? (
				<P className="rounded-lg border p-4 text-muted-foreground text-sm">
					No conversations found for this topic yet. Brain will file
					new ones as they arrive.
				</P>
			) : (
				<ul id={listId} className="divide-y rounded-lg border">
					{items.slice(0, shown).map((item) => {
						const isMoved = !!moved[item.id];
						const isOn = !unchecked.has(item.id);
						const boxId = `${listId}-${item.id}`;
						return (
							<li
								key={item.id}
								className={cn(
									"flex min-w-0 items-start gap-3 px-3 py-2",
									(!isOn || isMoved) && "bg-muted/30",
								)}
							>
								<Checkbox
									id={boxId}
									className="mt-0.5"
									checked={isOn && !isMoved}
									disabled={
										busy || !item.canCorrect || isMoved
									}
									onCheckedChange={(checked) =>
										setUnchecked((current) => {
											const next = new Set(current);
											if (checked) next.delete(item.id);
											else next.add(item.id);
											return next;
										})
									}
								/>
								<label
									htmlFor={boxId}
									className="min-w-0 flex-1 cursor-pointer"
								>
									<span
										className={cn(
											"block truncate text-sm",
											(!isOn || isMoved) &&
												"text-muted-foreground line-through",
										)}
										title={item.subject}
									>
										{item.subject}
									</span>
									<span className="block truncate text-muted-foreground text-xs">
										{[
											isMoved
												? `Moved to ${moved[item.id]}`
												: "",
											item.lastMessageAt
												? new Date(
														item.lastMessageAt,
													).toLocaleDateString(
														undefined,
														{
															month: "short",
															day: "numeric",
														},
													)
												: "",
											`${item.messageCount} ${item.messageCount === 1 ? "message" : "messages"}`,
											item.people
												.slice(0, 3)
												.map(
													(person) =>
														person.name ||
														person.email,
												)
												.join(", "),
										]
											.filter(Boolean)
											.join(` ${DOT} `)}
									</span>
								</label>
								{item.source === "teams" && (
									<Badge
										variant="secondary"
										className="shrink-0 gap-1 font-normal"
									>
										<MessagesSquare
											className="size-3"
											aria-hidden="true"
										/>{" "}
										Teams
									</Badge>
								)}
								{others.length > 0 &&
									item.canCorrect &&
									!isMoved && (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													className="h-7 shrink-0 text-muted-foreground"
													disabled={busy}
													aria-label={`Move "${item.subject}" to another topic`}
												>
													<CornerDownRight aria-hidden="true" />{" "}
													Move
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>
													Move to
												</DropdownMenuLabel>
												{others.map((other) => (
													<DropdownMenuItem
														key={other.key}
														onSelect={() =>
															void move(
																item,
																other,
															)
														}
													>
														{other.name}
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
									)}
							</li>
						);
					})}
				</ul>
			)}
			{(hasMore || shown < items.length) && (
				<Button
					type="button"
					variant="outline"
					className="self-start"
					disabled={busy}
					onClick={() => void showMore()}
				>
					Show more
					<span className="text-muted-foreground">
						({total - Math.min(shown, items.length)} left)
					</span>
				</Button>
			)}
			{navSlot &&
				createPortal(
					<>
						{index > 0 && (
							<Button
								type="button"
								variant="ghost"
								disabled={busy}
								onClick={() => void advance(-1)}
							>
								<ArrowLeft aria-hidden="true" /> Previous topic
							</Button>
						)}
						<Button
							type="button"
							disabled={busy}
							onClick={() => void advance(1)}
						>
							{isSending && <Spinner className="size-4" />}
							{index >= keys.length - 1
								? "Looks right, finish"
								: "Looks right, next topic"}
							<ArrowRight aria-hidden="true" />
						</Button>
					</>,
					navSlot,
				)}
		</div>
	);
}
