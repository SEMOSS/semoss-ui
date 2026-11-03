import { ChevronDown, GripVertical } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, P, Small } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { runBatch } from "../live/live-state";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { TopicChip as SharedTopicChip } from "./topic-chip";

// The Work page: the outcomes the owner is driving (D25), in the owner's order.
// Items Brain infers wait in review until the owner adds, merges or dismisses them.

type Row = Record<string, unknown>;

interface Step {
	id: string;
	text: string;
	status: string;
	assigneeId?: string;
	assigneeName?: string;
}

export interface Item {
	id: string;
	title: string;
	proposed: boolean;
	mine: boolean;
	topic?: string;
	topicId?: string;
	roomId?: string;
	due?: string;
	openSteps: Step[];
}

const str = (value: unknown): string =>
	typeof value === "string" ? value : "";
const list = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];

function toStep(row: Row): Step {
	return {
		id: str(row.id),
		text: str(row.text),
		status: str(row.status),
		assigneeId: str(row.assigneeId) || undefined,
		assigneeName: str(row.assigneeName) || undefined,
	};
}

function toItem(row: Row): Item {
	const topics = list(row.topics);
	const primary = topics.find((t) => t.primary) ?? topics[0];
	return {
		id: str(row.id),
		title: str(row.title),
		proposed: str(row.state) === "proposed",
		mine: row.mine === true,
		topic: primary ? str(primary.name) : undefined,
		topicId: primary ? str(primary.id) : undefined,
		roomId: str(row.roomId) || undefined,
		due: str(row.due) || undefined,
		openSteps: list(row.openSteps).map(toStep),
	};
}

function dueLabel(due?: string): { text: string; soon: boolean } | null {
	if (!due) return null;
	const at = new Date(due.replace(" ", "T"));
	if (Number.isNaN(at.getTime())) return null;
	return {
		text: at.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		}),
		soon: (at.getTime() - Date.now()) / 86_400_000 < 2,
	};
}

const errorText = (cause: unknown) =>
	cause instanceof Error ? cause.message : String(cause);

// the same topic chip Topics and threads use; a plain one if the topic is not loaded
function TopicChip({ item }: { item: Item }) {
	const { state } = useCollaborationSession();
	const topic = state.topics.find((t) => t.id === item.topicId);
	if (topic) return <SharedTopicChip topic={topic} />;
	if (!item.topic) return null;
	return (
		<span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-sm">
			{item.topic}
		</span>
	);
}

/** The work list data and the owner's actions on it. */
export function useWorkItems() {
	const { actions } = useInsight();
	const [items, setItems] = useState<Item[] | null>(null);
	const [selfId, setSelfId] = useState("");
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		try {
			const [out] = (await runBatch(actions, [
				pixel("WorkListMyWork"),
			])) as Row[];
			setItems(list(out?.workItems).map(toItem));
			setSelfId(str(out?.selfId));
			setError("");
		} catch (cause) {
			setError(errorText(cause));
		}
	}, [actions]);

	useEffect(() => {
		void load();
	}, [load]);

	const run = useCallback(
		async (statement: string) => {
			try {
				await runBatch(actions, [statement]);
				await load();
			} catch (cause) {
				setError(errorText(cause));
			}
		},
		[actions, load],
	);

	const isMine = useCallback(
		(step: Step) => !step.assigneeId || step.assigneeId === selfId,
		[selfId],
	);

	return { items, setItems, error, run, isMine };
}

function nextStep(item: Item, isMine: (step: Step) => boolean) {
	return (
		item.openSteps.find((s) => s.status === "open" && isMine(s)) ??
		item.openSteps[0]
	);
}

// page rows match the Topics list; Today's rows sit inside its card padding
const rowPad = (compact?: boolean) => (compact ? "py-4" : "px-5 py-4 md:px-6");

function openRoom(navigate: ReturnType<typeof useNavigate>, item: Item) {
	void navigate(
		item.roomId ? roomPath(item.roomId) : `/work/item/${item.id}`,
	);
}

// the first open step someone else owes the owner
function waitingOn(item: Item, isMine: (step: Step) => boolean) {
	return item.openSteps.find((s) => !isMine(s));
}

/** One row: the item, your next step and who you are waiting on; drag to reorder, Open room to work it. */
function ItemRow({
	item,
	compact,
	isMine,
	draggable,
	onDragStart,
	onDragOver,
	onDrop,
}: {
	item: Item;
	compact?: boolean;
	isMine: (step: Step) => boolean;
	draggable?: boolean;
	onDragStart?: () => void;
	onDragOver?: () => void;
	onDrop?: () => void;
}) {
	const navigate = useNavigate();
	const due = dueLabel(item.due);
	const mineNext = item.openSteps.find(
		(s) => s.status === "open" && isMine(s),
	);
	const waiting = waitingOn(item, isMine);

	return (
		<li
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={(event) => {
				if (!draggable) return;
				event.preventDefault();
				onDragOver?.();
			}}
			onDrop={(event) => {
				event.preventDefault();
				onDrop?.();
			}}
			className={cn(
				"group flex min-w-0 items-center gap-3 transition-colors hover:bg-accent",
				rowPad(compact),
				compact && "-mx-5 px-5",
			)}
		>
			{draggable ? (
				<GripVertical
					aria-hidden="true"
					className="-ml-2 size-4 flex-none cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground"
				/>
			) : null}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={() => openRoom(navigate, item)}
						className="min-w-0 break-words text-left font-medium text-base hover:underline focus-visible:outline-2 focus-visible:outline-ring"
					>
						{item.title}
					</button>
					<TopicChip item={item} />
				</div>
				{mineNext ? (
					<P className="truncate text-sm">
						<span className="text-muted-foreground">Next: </span>
						{mineNext.text}
					</P>
				) : null}
				{waiting ? (
					<P className="truncate text-muted-foreground text-sm">
						Waiting on {waiting.assigneeName ?? "someone"}:{" "}
						{waiting.text}
					</P>
				) : null}
				{!mineNext && !waiting ? (
					<P className="text-muted-foreground text-sm">
						No open steps
					</P>
				) : null}
			</div>
			{due ? (
				<Small
					className={cn(
						"shrink-0 text-muted-foreground tabular-nums",
						due.soon && "text-destructive",
					)}
				>
					{due.text}
				</Small>
			) : null}
			<Button
				size="sm"
				variant="outline"
				className="shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
				onClick={() => openRoom(navigate, item)}
			>
				Open room
			</Button>
		</li>
	);
}

/** Review: each inferred item is added, merged into another, or dismissed. */
function ReviewList({
	items,
	all,
	isMine,
	run,
}: {
	items: Item[];
	all: Item[];
	isMine: (step: Step) => boolean;
	run: (statement: string) => Promise<void>;
}) {
	const [mergeFor, setMergeFor] = useState<string | null>(null);
	if (!items.length) {
		return (
			<div className="space-y-2 p-6">
				<P>Nothing new to review.</P>
				<Link
					to="/work"
					className="text-muted-foreground text-sm hover:text-foreground"
				>
					Back to Work
				</Link>
			</div>
		);
	}
	return (
		<ul aria-label="New work items" className="divide-y divide-border">
			{items.map((item) => {
				const next = nextStep(item, isMine);
				return (
					<li
						key={item.id}
						className="flex min-w-0 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center md:px-6"
					>
						<div className="min-w-0 flex-1 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<Small className="break-words font-medium text-base">
									{item.title}
								</Small>
								<TopicChip item={item} />
							</div>
							{next ? (
								<P className="text-muted-foreground text-sm">
									Next: {next.text}
								</P>
							) : null}
							<Small className="block text-muted-foreground">
								{item.openSteps.length} open step
								{item.openSteps.length === 1 ? "" : "s"}
								{item.mine ? "" : ", none assigned to you"}
							</Small>
						</div>
						{mergeFor === item.id ? (
							<div className="flex shrink-0 items-center gap-2">
								<select
									aria-label="Merge into"
									defaultValue=""
									onChange={(event) => {
										const into = event.target.value;
										if (!into) return;
										setMergeFor(null);
										void run(
											pixel("WorkMergeItems", {
												taskId: item.id,
												intoTaskId: into,
											}),
										);
									}}
									className="h-8 max-w-xs rounded-md border border-input bg-background px-2 text-sm"
								>
									<option value="">Merge into...</option>
									{all
										.filter((other) => other.id !== item.id)
										.map((other) => (
											<option
												key={other.id}
												value={other.id}
											>
												{other.title}
												{other.topic
													? ` (${other.topic})`
													: ""}
											</option>
										))}
								</select>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setMergeFor(null)}
								>
									Cancel
								</Button>
							</div>
						) : (
							<div className="flex shrink-0 items-center gap-1">
								<Button
									size="sm"
									variant="outline"
									onClick={() =>
										void run(
											pixel("WorkSaveWork", {
												taskId: item.id,
												accept: true,
											}),
										)
									}
								>
									Add to my work
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => setMergeFor(item.id)}
								>
									Merge into...
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-muted-foreground"
									onClick={() =>
										void run(
											pixel("WorkSaveWork", {
												taskId: item.id,
												status: "dropped",
											}),
										)
									}
								>
									Dismiss
								</Button>
							</div>
						)}
					</li>
				);
			})}
		</ul>
	);
}

function split(items: Item[]) {
	const kept = items.filter((i) => !i.proposed);
	const proposed = items.filter((i) => i.proposed);
	return {
		// the owner's own first, then the rest someone else is driving
		review: [
			...proposed.filter((i) => i.mine),
			...proposed.filter((i) => !i.mine),
		],
		proposed,
		mine: kept.filter((i) => i.mine),
		others: kept.filter((i) => !i.mine),
	};
}

/** The owner's work items; compact is Today's short list that links to Work. */
export function WorkItems({
	limit,
	review: reviewing,
}: {
	limit?: number;
	review?: boolean;
}) {
	const { items, setItems, error, run, isMine } = useWorkItems();
	const [dragId, setDragId] = useState<string | null>(null);
	const [showOthers, setShowOthers] = useState(false);
	const compact = Boolean(limit);

	if (items === null) {
		return (
			<div className={compact ? "py-4" : "p-6"}>
				{error ? (
					<P className="text-destructive text-sm">{error}</P>
				) : (
					<Small className="text-muted-foreground">Loading...</Small>
				)}
			</div>
		);
	}
	const { review, proposed, mine, others } = split(items);
	const shown = limit ? mine.slice(0, limit) : mine;

	if (reviewing) {
		return (
			<>
				{error ? (
					<P className="px-5 pt-4 text-destructive text-sm md:px-6">
						{error}
					</P>
				) : null}
				<ReviewList
					items={review}
					all={items}
					isMine={isMine}
					run={run}
				/>
			</>
		);
	}

	const moveTo = (targetId: string) => {
		if (!dragId || dragId === targetId) return;
		const order = [...mine];
		const from = order.findIndex((i) => i.id === dragId);
		const to = order.findIndex((i) => i.id === targetId);
		if (from < 0 || to < 0) return;
		const [moved] = order.splice(from, 1);
		order.splice(to, 0, moved);
		setItems([...order, ...others, ...proposed]);
	};
	const saveOrder = () => {
		setDragId(null);
		void run(pixel("WorkReorderItems", { taskIds: mine.map((i) => i.id) }));
	};

	return (
		<>
			{error ? (
				<P
					className={cn(
						"text-destructive text-sm",
						compact ? "pt-4" : "px-5 pt-4 md:px-6",
					)}
				>
					{error}
				</P>
			) : null}
			{review.length ? (
				<div
					className={cn(
						"flex items-center gap-3 border-border border-b bg-muted/40 py-3 text-sm",
						compact ? "-mx-5 -mt-1 px-5" : "px-5 md:px-6",
					)}
				>
					<span className="flex-1 text-muted-foreground">
						<span className="font-medium text-foreground">
							{review.length} new work item
							{review.length === 1 ? "" : "s"}
						</span>{" "}
						from your mail and chats
					</span>
					<Button asChild size="sm" variant="outline">
						<Link to="/work/review">Review</Link>
					</Button>
				</div>
			) : null}
			{shown.length ? (
				<ul
					aria-label="Your work items"
					className="divide-y divide-border"
				>
					{shown.map((item) => (
						<ItemRow
							key={item.id}
							item={item}
							compact={compact}
							isMine={isMine}
							draggable={!compact}
							onDragStart={() => setDragId(item.id)}
							onDragOver={() => moveTo(item.id)}
							onDrop={saveOrder}
						/>
					))}
				</ul>
			) : (
				<P
					className={cn(
						"text-muted-foreground text-sm",
						compact ? "py-4" : "p-6",
					)}
				>
					{review.length
						? "Review the new items to start your list."
						: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
				</P>
			)}
			{compact && mine.length > shown.length ? (
				<Link
					to="/work"
					className="-mx-5 block border-border border-t px-5 py-3 text-muted-foreground text-sm hover:text-foreground"
				>
					See all {mine.length}
				</Link>
			) : null}
			{!compact && others.length ? (
				<div className="border-border border-t">
					<button
						type="button"
						onClick={() => setShowOthers((v) => !v)}
						className="flex w-full items-center gap-2 px-5 py-3 text-left text-muted-foreground text-sm hover:bg-accent hover:text-foreground md:px-6"
					>
						<ChevronDown
							aria-hidden="true"
							className={cn(
								"size-4 transition-transform",
								showOthers && "rotate-180",
							)}
						/>
						{others.length} item{others.length === 1 ? "" : "s"}{" "}
						other people are driving
					</button>
					{showOthers ? (
						<ul
							aria-label="Work other people are driving"
							className="divide-y divide-border border-border border-t"
						>
							{others.map((item) => (
								<ItemRow
									key={item.id}
									item={item}
									isMine={isMine}
								/>
							))}
						</ul>
					) : null}
				</div>
			) : null}
		</>
	);
}

export function WorkItemsList({ review = false }: { review?: boolean }) {
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title={review ? "New work items" : "Work"}
					description={
						review
							? "Inferred from your mail and chats. Add the real ones to your work, merge duplicates, dismiss the rest."
							: "What you are working toward, in your order. Drag to reorder."
					}
					actions={
						review ? (
							<Button asChild variant="outline" size="sm">
								<Link to="/work">Back to Work</Link>
							</Button>
						) : (
							<Button asChild variant="outline" size="sm">
								<Link to="/work/topics">Topics</Link>
							</Button>
						)
					}
				/>
			}
		>
			<WorkItems review={review} />
		</CollaborationSurface>
	);
}
