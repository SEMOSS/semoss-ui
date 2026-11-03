import { Check, GripVertical } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import { Button, cn, P, Small } from "@semoss/ui/next";
import { pixel } from "@/lib/pixel";
import { roomPath, threadPath } from "@/lib/workspace-paths";
import { runBatch } from "../live/live-state";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";

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

interface Detail {
	steps: Step[];
	threads: { threadId: string; subject: string; source?: string }[];
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

const sourceLabel = (source?: string) =>
	source === "teams" ? "chat" : source === "meeting" ? "meeting" : "email";

const errorText = (cause: unknown) =>
	cause instanceof Error ? cause.message : String(cause);

function TopicChip({ name }: { name?: string }) {
	if (!name) return null;
	return (
		<span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">
			{name}
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

	const detail = useCallback(
		async (taskId: string): Promise<Detail> => {
			const [out] = (await runBatch(actions, [
				pixel("WorkGetWork", { taskId }),
			])) as Row[];
			return {
				steps: list(out?.steps)
					.map(toStep)
					.filter((s) => s.status !== "dropped"),
				threads: list(out?.threads).map((t) => ({
					threadId: str(t.threadId),
					subject: str(t.subject) || "(no subject)",
					source: str(t.source) || undefined,
				})),
			};
		},
		[actions],
	);

	const isMine = useCallback(
		(step: Step) => !step.assigneeId || step.assigneeId === selfId,
		[selfId],
	);

	return { items, setItems, error, run, detail, isMine };
}

function nextStep(item: Item, isMine: (step: Step) => boolean) {
	return (
		item.openSteps.find((s) => s.status === "open" && isMine(s)) ??
		item.openSteps[0]
	);
}

/** One row: drag to reorder, click to open its steps. */
function ItemRow({
	item,
	isMine,
	detail,
	run,
	draggable,
	onDragStart,
	onDragOver,
	onDrop,
}: {
	item: Item;
	isMine: (step: Step) => boolean;
	detail: (taskId: string) => Promise<Detail>;
	run: (statement: string) => Promise<void>;
	draggable?: boolean;
	onDragStart?: () => void;
	onDragOver?: () => void;
	onDrop?: () => void;
}) {
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const [info, setInfo] = useState<Detail | null>(null);
	const due = dueLabel(item.due);
	const next = nextStep(item, isMine);

	const refresh = useCallback(
		() =>
			detail(item.id)
				.then(setInfo)
				.catch(() => {}),
		[detail, item.id],
	);
	useEffect(() => {
		if (open) void refresh();
	}, [open, refresh]);

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
			className="group"
		>
			<div className="flex items-center gap-3 px-3 py-3 hover:bg-muted/40">
				{draggable ? (
					<GripVertical
						aria-hidden="true"
						className="size-4 flex-none cursor-grab text-muted-foreground/50"
					/>
				) : null}
				<button
					type="button"
					aria-expanded={open}
					onClick={() => setOpen((v) => !v)}
					className="min-w-0 flex-1 text-left"
				>
					<div className="font-medium">{item.title}</div>
					<div className="truncate text-muted-foreground text-sm">
						{next ? next.text : "No open steps"}
					</div>
				</button>
				<TopicChip name={item.topic} />
				<Button
					size="sm"
					variant="outline"
					className="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
					onClick={() =>
						void navigate(
							item.roomId
								? roomPath(item.roomId)
								: `/work/item/${item.id}`,
						)
					}
				>
					Open room
				</Button>
				<Small
					className={cn(
						"w-12 text-right text-muted-foreground",
						due?.soon && "text-destructive",
					)}
				>
					{due?.text ?? ""}
				</Small>
			</div>
			{open ? (
				<div className="pr-4 pb-4 pl-10">
					{info ? (
						<>
							<ul className="space-y-1">
								{info.steps.map((step) => {
									const done = step.status === "done";
									return (
										<li
											key={step.id}
											className={cn(
												"flex items-start gap-2 text-sm",
												done &&
													"text-muted-foreground line-through",
											)}
										>
											<button
												type="button"
												aria-label={
													done
														? "Reopen step"
														: "Mark step done"
												}
												onClick={() =>
													void run(
														pixel(
															"WorkUpdateStep",
															{
																stepId: step.id,
																status: done
																	? "open"
																	: "done",
															},
														),
													).then(refresh)
												}
												className={cn(
													"mt-0.5 flex size-4 flex-none items-center justify-center rounded border border-muted-foreground/50",
													done &&
														"bg-muted-foreground/50 text-background",
												)}
											>
												{done ? (
													<Check className="size-3" />
												) : null}
											</button>
											<span className="flex-1">
												{step.text}
											</span>
											<span className="text-muted-foreground text-xs">
												{isMine(step)
													? "You"
													: (step.assigneeName ??
														"Someone")}
											</span>
										</li>
									);
								})}
							</ul>
							{info.threads.length ? (
								<Small className="mt-2 block text-muted-foreground">
									From{" "}
									{info.threads.map((t, n) => (
										<span key={t.threadId}>
											{n ? ", " : ""}
											<Link
												to={threadPath(t.threadId)}
												className="underline-offset-2 hover:underline"
											>
												{t.subject}
											</Link>{" "}
											({sourceLabel(t.source)})
										</span>
									))}
								</Small>
							) : null}
						</>
					) : (
						<Small className="text-muted-foreground">
							Loading...
						</Small>
					)}
				</div>
			) : null}
		</li>
	);
}

/** Review: each inferred item is added, merged into another, or dismissed. */
function ReviewList({
	items,
	all,
	isMine,
	run,
	onBack,
}: {
	items: Item[];
	all: Item[];
	isMine: (step: Step) => boolean;
	run: (statement: string) => Promise<void>;
	onBack: () => void;
}) {
	const [mergeFor, setMergeFor] = useState<string | null>(null);
	return (
		<div className="max-w-3xl space-y-3">
			{items.length ? null : (
				<P className="text-muted-foreground text-sm">
					Nothing new to review.
				</P>
			)}
			{items.map((item) => {
				const next = nextStep(item, isMine);
				return (
					<div
						key={item.id}
						className="rounded-lg border bg-background p-4"
					>
						<div className="flex items-center gap-2">
							<span className="font-medium">{item.title}</span>
							<TopicChip name={item.topic} />
						</div>
						{next ? (
							<div className="text-muted-foreground text-sm">
								Next: {next.text}
							</div>
						) : null}
						<Small className="text-muted-foreground">
							{item.openSteps.length} open step
							{item.openSteps.length === 1 ? "" : "s"}
							{item.mine ? "" : ", none assigned to you"}
						</Small>
						{mergeFor === item.id ? (
							<div className="mt-3 flex flex-wrap items-center gap-2">
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
									className="h-8 max-w-md rounded-md border bg-background px-2 text-sm"
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
							<div className="mt-3 flex gap-2">
								<Button
									size="sm"
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
									variant="outline"
									onClick={() => setMergeFor(item.id)}
								>
									Merge into...
								</Button>
								<Button
									size="sm"
									variant="outline"
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
					</div>
				);
			})}
			<Button size="sm" variant="outline" onClick={onBack}>
				Back to Work
			</Button>
		</div>
	);
}

/** The owner's work items; with a limit, a short list for Today that links to Work. */
export function WorkItems({ limit }: { limit?: number }) {
	const { items, setItems, error, run, detail, isMine } = useWorkItems();
	const [reviewing, setReviewing] = useState(false);
	const [dragId, setDragId] = useState<string | null>(null);
	const [showOthers, setShowOthers] = useState(false);

	if (items === null) {
		return error ? (
			<P className="text-destructive text-sm">{error}</P>
		) : (
			<Small className="text-muted-foreground">Loading...</Small>
		);
	}
	const kept = items.filter((i) => !i.proposed);
	const proposed = items.filter((i) => i.proposed);
	// the owner's own first, then the rest someone else is driving
	const review = [
		...proposed.filter((i) => i.mine),
		...proposed.filter((i) => !i.mine),
	];
	const mine = kept.filter((i) => i.mine);
	const others = kept.filter((i) => !i.mine);
	const shown = limit ? mine.slice(0, limit) : mine;

	if (reviewing && !limit) {
		return (
			<ReviewList
				items={review}
				all={items}
				isMine={isMine}
				run={run}
				onBack={() => setReviewing(false)}
			/>
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
		<div className="max-w-3xl">
			{error ? (
				<P className="mb-3 text-destructive text-sm">{error}</P>
			) : null}
			{review.length ? (
				<div className="mb-5 flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5">
					<span
						aria-hidden="true"
						className="size-2 rounded-full bg-primary"
					/>
					<span className="flex-1 text-muted-foreground text-sm">
						<span className="font-medium text-foreground">
							{review.length} new work item
							{review.length === 1 ? "" : "s"}
						</span>{" "}
						from your mail and chats
					</span>
					{limit ? (
						<Button asChild size="sm">
							<Link to="/work">Review</Link>
						</Button>
					) : (
						<Button size="sm" onClick={() => setReviewing(true)}>
							Review
						</Button>
					)}
				</div>
			) : null}
			<ul
				aria-label="Your work items"
				className="divide-y divide-border rounded-lg border bg-background"
			>
				{shown.length ? (
					shown.map((item) => (
						<ItemRow
							key={item.id}
							item={item}
							isMine={isMine}
							detail={detail}
							run={run}
							draggable={!limit}
							onDragStart={() => setDragId(item.id)}
							onDragOver={() => moveTo(item.id)}
							onDrop={saveOrder}
						/>
					))
				) : (
					<li className="px-4 py-3 text-muted-foreground text-sm">
						{review.length
							? "Review the new items to start your list."
							: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
					</li>
				)}
			</ul>
			{limit && mine.length > shown.length ? (
				<Link
					to="/work"
					className="mt-3 inline-block text-muted-foreground text-sm hover:text-foreground"
				>
					See all {mine.length}
				</Link>
			) : null}
			{!limit && others.length ? (
				<>
					<button
						type="button"
						onClick={() => setShowOthers((v) => !v)}
						className="mt-4 text-muted-foreground text-sm hover:text-foreground"
					>
						{showOthers ? "Hide" : "Show"} {others.length} item
						{others.length === 1 ? "" : "s"} other people are
						driving
					</button>
					{showOthers ? (
						<ul
							aria-label="Work other people are driving"
							className="mt-2 divide-y divide-border rounded-lg border bg-background"
						>
							{others.map((item) => (
								<ItemRow
									key={item.id}
									item={item}
									isMine={isMine}
									detail={detail}
									run={run}
								/>
							))}
						</ul>
					) : null}
				</>
			) : null}
		</div>
	);
}

export function WorkItemsList() {
	return (
		<CollaborationSurface
			header={
				<CollaborationPageHeader
					title="Work"
					description="What you are working toward. Mail, chats and meetings keep it up to date."
					actions={
						<Button asChild variant="outline" size="sm">
							<Link to="/work/topics">Topics</Link>
						</Button>
					}
				/>
			}
		>
			<WorkItems />
		</CollaborationSurface>
	);
}
