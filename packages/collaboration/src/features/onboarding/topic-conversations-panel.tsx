import { CornerDownRight, MessagesSquare, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import type { TopicReview } from "./topic-review-api";
import type { useTopicReviewChanges } from "./use-topic-review-changes";

// the server takes at most this many conversations per change
const BATCH = 50;
// conversations on screen at first, and per Show more
const PAGE = 10;
// a link this sure or less is worth a look
const WEAK = 60;

interface TopicConversationsPanelProps {
	actions: InsightActions;
	review: TopicReview;
	topicKey: string;
	/** Kept topics a conversation can move to. */
	others: { key: string; name: string }[];
	isBusy: boolean;
	changes: ReturnType<typeof useTopicReviewChanges>;
	/** Save the draft so the conversations are read for its latest revision. */
	onSave: () => Promise<TopicReview>;
}

/** One topic's conversations: the doubtful ones first; take any off or move them, one or many at a time. */
export function TopicConversationsPanel({
	actions,
	review,
	topicKey,
	others,
	isBusy,
	changes,
	onSave,
}: TopicConversationsPanelProps) {
	const [items, setItems] = useState<TopicEvidenceItem[]>([]);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [shown, setShown] = useState(PAGE);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const latest = useRef(review);
	latest.current = review;
	const topicId = review.draft.topics.find((t) => t.key === topicKey)?.id;
	const corrections = review.draft.corrections ?? [];
	const nameOf = (key: string) =>
		others.find((other) => other.key === key)?.name ?? "another topic";
	const isOff = (threadId: string) =>
		corrections.some(
			(row) =>
				row.threadId === threadId &&
				row.topicKey === topicKey &&
				row.state === "exclude",
		);
	const movedTo = (threadId: string) =>
		corrections.find(
			(row) =>
				row.threadId === threadId &&
				row.topicKey !== topicKey &&
				row.state === "include" &&
				row.primary,
		)?.topicKey;
	// weakly linked, or also linked to another topic
	const toCheck = (item: TopicEvidenceItem) => {
		const own = item.links.find((link) => link.topicId === topicId);
		return (
			(!!own && own.confidence <= WEAK) ||
			item.links.some((link) => link.topicId !== topicId)
		);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload only when the topic changes
	useEffect(() => {
		let isCurrent = true;
		setIsLoading(true);
		setError(null);
		setItems([]);
		setPicked(new Set());
		setShown(PAGE);
		onSave()
			.then((saved) => getTopicEvidence(actions, saved, topicKey))
			.then((page) => {
				if (!isCurrent) return;
				setItems(page.items);
				setTotal(page.total);
				setHasMore(page.hasMore);
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
	}, [actions, topicKey]);

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
				topicKey,
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
		type: "confirm" | "reject" | "move",
		rows: TopicEvidenceItem[],
		targetKey?: string,
	): Promise<void> => {
		for (let start = 0; start < rows.length; start += BATCH) {
			const part = rows.slice(start, start + BATCH);
			const change: TopicReviewChange = {
				type,
				topicKey,
				threadIds: part.map((row) => row.id),
				versions: Object.fromEntries(
					part.map((row) => [row.id, row.version]),
				),
				...(targetKey ? { targetKey } : {}),
			};
			if (!(await changes.change(change))) return;
		}
		setPicked(new Set());
	};

	const busy = isBusy || isLoading;
	// doubtful first, otherwise newest first as the server sent them
	const ordered = [
		...items.filter((item) => toCheck(item)),
		...items.filter((item) => !toCheck(item)),
	];
	const visible = ordered.slice(0, shown);
	const pickedRows = visible.filter((item) => picked.has(item.id));
	const checkCount = items.filter(
		(item) => toCheck(item) && !isOff(item.id),
	).length;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<P className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
					Conversations
					{total ? ` (${total})` : ""}
				</P>
				{checkCount > 0 && (
					<span className="text-muted-foreground text-xs">
						{checkCount} worth a look, shown first
					</span>
				)}
			</div>
			{pickedRows.length > 0 && (
				<div className="flex flex-wrap items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm">
					<span className="font-medium">
						{pickedRows.length} selected
					</span>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={busy}
						onClick={() => void send("reject", pickedRows)}
					>
						<X aria-hidden="true" /> Not this topic
					</Button>
					{others.length > 0 && (
						<MoveMenu
							others={others}
							disabled={busy}
							label="Move to"
							onPick={(key) => void send("move", pickedRows, key)}
						/>
					)}
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={() => setPicked(new Set())}
					>
						Clear
					</Button>
				</div>
			)}
			{error && <Failure error={error} />}
			{isLoading && items.length === 0 ? (
				<P className="flex items-center gap-2 text-muted-foreground text-sm">
					<Spinner className="size-4" /> Loading conversations...
				</P>
			) : items.length === 0 ? (
				<P className="text-muted-foreground text-sm">
					No conversations yet. New ones are filed here as they
					arrive.
				</P>
			) : (
				<ul className="divide-y rounded-md border">
					{visible.map((item) => {
						const off = isOff(item.id);
						const target = movedTo(item.id);
						return (
							<li
								key={item.id}
								className={cn(
									"flex min-w-0 items-start gap-2.5 px-3 py-2",
									off && "bg-muted/30",
								)}
							>
								<Checkbox
									className="mt-0.5"
									aria-label={`Select "${item.subject}"`}
									checked={picked.has(item.id)}
									disabled={busy || !item.canCorrect || off}
									onCheckedChange={() =>
										setPicked((current) => {
											const next = new Set(current);
											if (next.has(item.id))
												next.delete(item.id);
											else next.add(item.id);
											return next;
										})
									}
								/>
								<div className="min-w-0 flex-1">
									<span
										className={cn(
											"block truncate text-sm",
											off &&
												"text-muted-foreground line-through",
										)}
										title={item.subject}
									>
										{item.subject}
									</span>
									<span className="block truncate text-muted-foreground text-xs">
										{[
											off
												? target
													? `Moved to ${nameOf(target)}`
													: "Taken off this topic"
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
								</div>
								{toCheck(item) && !off && (
									<Badge
										variant="outline"
										className="shrink-0 font-normal"
										title="The match is weak, or it also fits another topic"
									>
										Check
									</Badge>
								)}
								{item.source === "teams" && (
									<Badge
										variant="secondary"
										className="shrink-0 gap-1 font-normal"
									>
										<MessagesSquare
											className="size-3"
											aria-hidden="true"
										/>
										Teams
									</Badge>
								)}
								{item.canCorrect &&
									(off ? (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="h-7 shrink-0 text-muted-foreground"
											disabled={busy || !!target}
											onClick={() =>
												void send("confirm", [item])
											}
										>
											<Undo2 aria-hidden="true" /> Put
											back
										</Button>
									) : (
										<>
											{others.length > 0 && (
												<MoveMenu
													others={others}
													disabled={busy}
													label={`Move "${item.subject}" to another topic`}
													onPick={(key) =>
														void send(
															"move",
															[item],
															key,
														)
													}
												/>
											)}
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-7 shrink-0 text-muted-foreground"
												disabled={busy}
												aria-label={`Take "${item.subject}" off this topic`}
												onClick={() =>
													void send("reject", [item])
												}
											>
												<X
													className="size-3.5"
													aria-hidden="true"
												/>
											</Button>
										</>
									))}
							</li>
						);
					})}
				</ul>
			)}
			{(hasMore || shown < items.length) && (
				<Button
					type="button"
					variant="outline"
					size="sm"
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
		</div>
	);
}

function MoveMenu({
	others,
	disabled,
	label,
	onPick,
}: {
	others: { key: string; name: string }[];
	disabled: boolean;
	label: string;
	onPick: (key: string) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 shrink-0 text-muted-foreground"
					disabled={disabled}
					aria-label={label}
				>
					<CornerDownRight aria-hidden="true" /> Move
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="max-h-80 overflow-y-auto"
			>
				<DropdownMenuLabel>Move to</DropdownMenuLabel>
				{others.map((other) => (
					<DropdownMenuItem
						key={other.key}
						onSelect={() => onPick(other.key)}
					>
						{other.name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
