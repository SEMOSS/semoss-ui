import {
	ArrowLeft,
	ArrowRight,
	ArrowUpDown,
	ChevronDown,
	ChevronsDownUp,
	ChevronsUpDown,
	CircleDashed,
	CornerDownRight,
	Ellipsis,
	GripVertical,
	Hourglass,
	Inbox,
	Info,
	Link2,
	ListChecks,
	Mail,
	Plus,
	Tags,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Label,
	P,
	Progress,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { Room } from "@/features/collaboration/state/collaboration.types";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { givenFirst } from "@/lib/person-name";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { localDue, runBatch } from "../live/live-state";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { TaskContextView, useTaskContext } from "./task-context";
import { TopicChip as SharedTopicChip } from "./topic-chip";
import { WorkBuildMenu } from "./work-build-menu";
import { WorkWaitingOn } from "./work-waiting-on";

// The Work page: the outcomes the owner is driving (D25), in the owner's order.
// Items Brain infers wait in review until the owner adds, merges or dismisses them.

type Row = Record<string, unknown>;

interface Step {
	id: string;
	text: string;
	status: string;
	kind?: string;
	assigneeId?: string;
	assigneeName?: string;
}

interface Item {
	id: string;
	title: string;
	proposed: boolean;
	mine: boolean;
	topic?: string;
	topicId?: string;
	roomId?: string;
	rooms?: Room[];
	due?: string;
	openSteps: Step[];
}

const str = (value: unknown): string =>
	typeof value === "string" ? value : "";
const list = (value: unknown): Row[] =>
	Array.isArray(value) ? (value as Row[]) : [];

function toRoom(row: Row): Room {
	return {
		id: str(row.id),
		title: str(row.title) || undefined,
		lastActivity: str(row.lastActivity),
	};
}

function toStep(row: Row): Step {
	return {
		id: str(row.id),
		text: str(row.text),
		status: str(row.status),
		kind: str(row.kind) || undefined,
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
		rooms: list(row.rooms).map(toRoom),
		due: str(row.due) || undefined,
		openSteps: list(row.openSteps).map(toStep),
	};
}

export function dueLabel(due?: string): { text: string; soon: boolean } | null {
	const shown = localDue(due);
	if (!shown) return null;
	const at = new Date(shown.replace(" ", "T"));
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

/** The same topic chip Topics and threads use; a plain one if the topic is not loaded. */
function ItemTopicChip({ item }: { item: Item }) {
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
	const mergeChats = useCallback(
		async (
			taskId: string,
			roomId: string,
			intoRoomId: string,
		): Promise<void> => {
			try {
				await runBatch(actions, [
					pixel("WorkMergeRooms", { taskId, roomId, intoRoomId }),
				]);
				await load();
			} catch (cause) {
				const message = errorText(cause);
				setError(message);
				throw new Error(message);
			}
		},
		[actions, load],
	);

	const isMine = useCallback(
		(step: Step) =>
			step.kind !== "waiting_on" &&
			(!step.assigneeId || step.assigneeId === selfId),
		[selfId],
	);

	return { items, setItems, error, run, mergeChats, isMine };
}

/** An item's chats, newest first; an older server reports only its one room. */
export function roomsOf(item: Item): Room[] {
	if (item.rooms?.length) return item.rooms;
	return item.roomId ? [{ id: item.roomId, lastActivity: "" }] : [];
}

const chatLabel = (room: Room, index: number, total: number) =>
	room.title || `Chat ${total - index}`;

/** The owner's next step: theirs first, then one nobody was named for (a group ask on their item). */
export function mineNext(item: Item, isMine: (step: Step) => boolean) {
	return (
		item.openSteps.find((s) => s.status === "open" && isMine(s)) ??
		item.openSteps.find((s) => isMine(s))
	);
}

function nextStep(item: Item, isMine: (step: Step) => boolean) {
	return mineNext(item, isMine) ?? item.openSteps[0];
}

/** Where an item is worked: its newest room, legacy room, or the item page until it has one. */
export const itemPath = (item: Item) => {
	const room = item.rooms?.[0]; // Newest first
	const roomId = room?.id || item.roomId;
	return roomId ? roomPath(roomId) : `/work/item/${item.id}`;
};

/** The first open step someone else owes the owner. */
export function waitingOn(item: Item, isMine: (step: Step) => boolean) {
	return item.openSteps.find((s) => !isMine(s));
}

/** One row: the item, the owner's next step or what it waits on, and how many steps others owe; the owner's rows drag, and their menu moves them. */
function ItemRow({
	item,
	isMine,
	showTopic,
	onRequestMerge,
	onDragStart,
	onDragOver,
	onDragEnd,
	onMoveUp,
	onMoveDown,
}: {
	item: Item;
	isMine: (step: Step) => boolean;
	/** Off when the card already names the one topic every row shares. */
	showTopic: boolean;
	/** Opens the merge dialog for an item with several chats. */
	onRequestMerge?: (item: Item) => void;
	/** Given for the owner's own rows, which can be put in order. */
	onDragStart?: () => void;
	onDragOver?: () => void;
	onDragEnd?: () => void;
	/** Moves the row one place; absent at that end of the list. */
	onMoveUp?: () => void;
	onMoveDown?: () => void;
}) {
	const draggable = Boolean(onDragStart);
	const due = dueLabel(item.due);
	const next = mineNext(item, isMine);
	const waiting = waitingOn(item, isMine);
	const owed = item.openSteps.filter((step) => !isMine(step)).length;
	const rooms = roomsOf(item);

	return (
		<li
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={(event) => {
				if (!draggable) return;
				event.preventDefault();
				onDragOver?.();
			}}
			onDrop={(event) => event.preventDefault()}
			// the dragged row hears the end even when the drop misses every row
			onDragEnd={onDragEnd}
			className="group flex min-w-0 gap-3 py-4"
		>
			{draggable ? (
				<GripVertical
					aria-hidden="true"
					className="mt-1.5 size-4 shrink-0 cursor-grab text-muted-foreground/60 group-hover:text-muted-foreground"
				/>
			) : null}
			<div className="min-w-0 flex-1 space-y-1.5">
				<div className="flex items-start gap-2">
					<div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
						<Link
							to={itemPath(item)}
							className="wrap-anywhere min-w-0 rounded-sm font-medium text-lg leading-snug hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
						>
							{item.title}
						</Link>
						{showTopic ? <ItemTopicChip item={item} /> : null}
					</div>
					{draggable || rooms.length > 0 ? (
						// dragging needs another way to reorder (WCAG 2.5.7), so the menu moves the row too
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`More actions for ${item.title}`}
									className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
								>
									<Ellipsis aria-hidden="true" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link to={itemPath(item)}>Open room</Link>
								</DropdownMenuItem>
								{rooms.length > 0 ? (
									<>
										<DropdownMenuItem asChild>
											<Link
												to={`/work/item/${encodeURIComponent(item.id)}`}
											>
												New chat
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
											Chats
										</DropdownMenuLabel>
										{rooms.map((room, index) => (
											<DropdownMenuItem
												key={room.id}
												asChild
											>
												<Link to={roomPath(room.id)}>
													<span className="truncate">
														{chatLabel(
															room,
															index,
															rooms.length,
														)}
													</span>
												</Link>
											</DropdownMenuItem>
										))}
										{onRequestMerge && rooms.length > 1 ? (
											<>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onSelect={() =>
														onRequestMerge(item)
													}
												>
													Merge chats...
												</DropdownMenuItem>
											</>
										) : null}
									</>
								) : null}
								{draggable ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											disabled={!onMoveUp}
											onSelect={onMoveUp}
										>
											Move up
										</DropdownMenuItem>
										<DropdownMenuItem
											disabled={!onMoveDown}
											onSelect={onMoveDown}
										>
											Move down
										</DropdownMenuItem>
									</>
								) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					) : null}
				</div>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<P className="flex min-w-0 flex-1 basis-56 items-center gap-2 text-muted-foreground text-sm">
						{next ? (
							<CornerDownRight
								aria-hidden="true"
								className="size-4 shrink-0"
							/>
						) : waiting ? (
							<Hourglass
								aria-hidden="true"
								className="size-4 shrink-0 text-warning"
							/>
						) : (
							<CircleDashed
								aria-hidden="true"
								className="size-4 shrink-0"
							/>
						)}
						<span className="min-w-0 truncate">
							{next ? (
								<>
									<span className="font-medium text-foreground">
										Next:
									</span>{" "}
									{next.text}
								</>
							) : waiting ? (
								<>
									<span className="font-medium text-foreground">
										Waiting on{" "}
										{waiting.assigneeName
											? givenFirst(waiting.assigneeName)
											: "someone"}
										:
									</span>{" "}
									{waiting.text}
								</>
							) : (
								"No open steps"
							)}
						</span>
					</P>
					{due ? (
						<span
							className={cn(
								"shrink-0 text-muted-foreground text-xs tabular-nums",
								due.soon && "text-destructive",
							)}
						>
							Due {due.text}
						</span>
					) : null}
					{owed > 0 ? (
						<span className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-xs">
							<Users aria-hidden="true" className="size-3.5" />
							{owed} {owed === 1 ? "dependency" : "dependencies"}
						</span>
					) : null}
				</div>
			</div>
		</li>
	);
}

// loads only once a row is opened
function ExpandedTask({ taskId, id }: { taskId: string; id: string }) {
	const { task, loading, error } = useTaskContext({ taskId });
	return (
		<div
			id={id}
			className="mt-3 overflow-hidden rounded-lg border bg-muted/30 sm:ml-6"
		>
			{task ? (
				<TaskContextView task={task} />
			) : (
				<P
					role={error ? "alert" : undefined}
					className={cn(
						"px-4 py-3 text-sm",
						error ? "text-destructive" : "text-muted-foreground",
					)}
				>
					{loading
						? "Loading details..."
						: error || "No more detail for this item."}
				</P>
			)}
		</div>
	);
}

/** The topic filter's value for every topic. */
const ALL_TOPICS = "all";

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
	const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
	const [topic, setTopic] = useState(ALL_TOPICS);
	// handled items leave the list, so the most seen at once is how many there were to review
	const [total, setTotal] = useState(items.length);
	if (items.length > total) setTotal(items.length);

	const topics = [
		...new Map(
			items.flatMap((item) =>
				item.topicId && item.topic
					? [[item.topicId, item.topic] as const]
					: [],
			),
		),
	];
	// a topic whose last item was handled falls back to every topic
	const shownTopic = topics.some(([id]) => id === topic) ? topic : ALL_TOPICS;
	const shown =
		shownTopic === ALL_TOPICS
			? items
			: items.filter((item) => item.topicId === shownTopic);
	const isAllOpen =
		shown.length > 0 && shown.every((item) => expanded.has(item.id));

	return (
		<BriefPanel
			title="To review"
			count={items.length}
			detail={
				shown.length ? (
					<>
						{topics.length > 1 ? (
							<Select value={shownTopic} onValueChange={setTopic}>
								<SelectTrigger
									size="sm"
									aria-label="Filter by topic"
									className="pointer-coarse:min-h-11 text-foreground"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent align="end">
									<SelectItem value={ALL_TOPICS}>
										All topics
									</SelectItem>
									{topics.map(([id, name]) => (
										<SelectItem key={id} value={id}>
											{name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : null}
						<Button
							size="sm"
							variant="ghost"
							className="pointer-coarse:min-h-11"
							onClick={() =>
								setExpanded(
									isAllOpen
										? new Set()
										: new Set(shown.map((item) => item.id)),
								)
							}
						>
							{isAllOpen ? (
								<ChevronsDownUp aria-hidden="true" />
							) : (
								<ChevronsUpDown aria-hidden="true" />
							)}
							{isAllOpen ? "Collapse all" : "Expand all"}
						</Button>
					</>
				) : undefined
			}
		>
			{shown.length ? (
				<ul
					aria-label="New work items"
					className="divide-y divide-border"
				>
					{shown.map((item) => {
						const isOpen = expanded.has(item.id);
						const next = nextStep(item, isMine);
						const targets = all.filter(
							(other) => other.id !== item.id,
						);
						// accepted work first; another new item is a second choice
						const targetGroups = [
							{
								label: "Your work",
								items: targets.filter(
									(other) => !other.proposed,
								),
							},
							{
								label: "Also new",
								items: targets.filter(
									(other) => other.proposed,
								),
							},
						];
						return (
							<li
								key={item.id}
								className="min-w-0 py-4 first:pt-0"
							>
								<div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
									<div className="min-w-0 flex-1 space-y-1.5">
										<button
											type="button"
											aria-expanded={isOpen}
											aria-controls={`review-${item.id}-detail`}
											onClick={() =>
												setExpanded((open) => {
													const next = new Set(open);
													if (!next.delete(item.id))
														next.add(item.id);
													return next;
												})
											}
											className="flex min-w-0 items-start gap-2 rounded-sm text-left font-medium text-lg leading-snug hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
										>
											<ChevronDown
												aria-hidden="true"
												className={cn(
													"mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
													!isOpen && "-rotate-90",
												)}
											/>
											<span className="wrap-anywhere min-w-0">
												{item.title}
											</span>
										</button>
										{next ? (
											<P className="flex items-start gap-2 pl-6 text-muted-foreground text-sm">
												<CornerDownRight
													aria-hidden="true"
													className="mt-0.5 size-4 shrink-0"
												/>
												<span className="min-w-0">
													<span className="font-medium text-foreground">
														Next:
													</span>{" "}
													{next.text}
												</span>
											</P>
										) : null}
										<div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-muted-foreground text-xs">
											<ItemTopicChip item={item} />
											<span className="flex items-center gap-1.5">
												<ListChecks
													aria-hidden="true"
													className="size-3.5"
												/>
												{item.openSteps.length} open
												step
												{item.openSteps.length === 1
													? ""
													: "s"}
											</span>
											{item.mine ? null : (
												<span>
													None assigned to you
												</span>
											)}
										</div>
									</div>
									<div className="flex shrink-0 flex-wrap items-center gap-1 pl-6 lg:pl-0">
										<Button
											size="sm"
											variant="secondary"
											// a softer primary than the solid button, which would shout on every row; the label stays dark because the blue is too dim to read on the tint
											className="pointer-coarse:min-h-11 bg-primary/10 text-foreground hover:bg-primary/20"
											onClick={() =>
												void run(
													pixel("WorkSaveWork", {
														taskId: item.id,
														accept: true,
													}),
												)
											}
										>
											<Plus
												aria-hidden="true"
												className="text-primary dark:text-foreground"
											/>
											Add to my work
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													size="sm"
													variant="ghost"
													className="pointer-coarse:min-h-11"
													disabled={!targets.length}
												>
													Merge into
													<ChevronDown aria-hidden="true" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="max-h-80 w-72 overflow-y-auto"
											>
												{targetGroups.map(
													(group, index) =>
														group.items.length ? (
															<DropdownMenuGroup
																key={
																	group.label
																}
															>
																{index > 0 &&
																targetGroups[0]
																	.items
																	.length ? (
																	<DropdownMenuSeparator />
																) : null}
																<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
																	{
																		group.label
																	}
																</DropdownMenuLabel>
																{group.items.map(
																	(other) => (
																		<DropdownMenuItem
																			key={
																				other.id
																			}
																			className="flex-col items-start gap-0.5"
																			onSelect={() =>
																				void run(
																					pixel(
																						"WorkMergeItems",
																						{
																							taskId: item.id,
																							intoTaskId:
																								other.id,
																						},
																					),
																				)
																			}
																		>
																			<span className="line-clamp-2 break-words">
																				{
																					other.title
																				}
																			</span>
																			{other.topic ? (
																				<span className="text-muted-foreground text-xs">
																					{
																						other.topic
																					}
																				</span>
																			) : null}
																		</DropdownMenuItem>
																	),
																)}
															</DropdownMenuGroup>
														) : null,
												)}
											</DropdownMenuContent>
										</DropdownMenu>
										<Button
											size="sm"
											variant="ghost"
											className="pointer-coarse:min-h-11 text-muted-foreground"
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
								</div>
								{isOpen ? (
									<ExpandedTask
										taskId={item.id}
										id={`review-${item.id}-detail`}
									/>
								) : null}
							</li>
						);
					})}
				</ul>
			) : (
				<div className="space-y-2">
					<P>Nothing new to review.</P>
					<Link
						to="/work"
						className="inline-flex min-h-6 items-center rounded-sm text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
					>
						Back to Work
					</Link>
				</div>
			)}
			{total > 0 ? (
				<div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4 text-muted-foreground text-xs">
					<span className="flex items-center gap-2">
						<Info
							aria-hidden="true"
							className="size-3.5 shrink-0"
						/>
						Expand an item to see its steps and source
						conversations.
					</span>
					<span className="flex items-center gap-3">
						<Progress
							aria-label="Items reviewed"
							getValueLabel={(value, max) => `${value} of ${max}`}
							value={total - items.length}
							max={total}
							className="h-1 w-16"
						/>
						<span>
							<span className="font-medium text-foreground tabular-nums">
								{total - items.length} of {total}
							</span>{" "}
							reviewed
						</span>
					</span>
				</div>
			) : null}
		</BriefPanel>
	);
}

/** The items to review, the owner's own and the ones someone else is driving. */
export function split(items: Item[]) {
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

/** The owner's order with one item moved to another's place. */
function placed(order: Item[], id: string, targetId: string): Item[] {
	const from = order.findIndex((i) => i.id === id);
	const to = order.findIndex((i) => i.id === targetId);
	if (from < 0 || to < 0 || from === to) return order;
	const next = [...order];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	return next;
}

/** Which of the owner's items the list shows. */
type View = "all" | "next" | "waiting";

const EMPTY_VIEW: Record<View, string> = {
	all: "",
	next: "No next steps of your own right now.",
	waiting: "You are not waiting on anyone.",
};

/** The owner's work items, or with review, the inferred ones waiting for the owner. */
export function WorkItems({ review: reviewing }: { review?: boolean }) {
	const { state } = useCollaborationSession();
	const { items, setItems, error, run, mergeChats, isMine } = useWorkItems();
	const [dragId, setDragId] = useState<string | null>(null);
	const dragFrom = useRef("");
	const [showOthers, setShowOthers] = useState(false);
	const [view, setView] = useState<View>("all");
	const waitingTab = useRef<HTMLButtonElement>(null);
	const [mergeItemId, setMergeItemId] = useState<string | null>(null);
	const [fromRoomId, setFromRoomId] = useState("");
	const [intoRoomId, setIntoRoomId] = useState("");
	const [isMerging, setIsMerging] = useState(false);
	const [mergeError, setMergeError] = useState("");
	const fromFieldId = useId();
	const intoFieldId = useId();

	if (items === null) {
		return error ? (
			<P role="alert" className="text-destructive text-sm">
				{error}
			</P>
		) : (
			<output className="block">
				<span className="sr-only">Loading your work</span>
				<Skeleton className="h-64 w-full rounded-xl" />
			</output>
		);
	}
	const { review, proposed, mine, others } = split(items);
	const mergeItem = items.find((item) => item.id === mergeItemId);
	const mergeRooms = mergeItem ? roomsOf(mergeItem) : [];
	const closeMerge = () => {
		setMergeItemId(null);
		setFromRoomId("");
		setIntoRoomId("");
		setMergeError("");
	};
	const handleRequestMerge = (item: Item) => {
		closeMerge();
		setMergeItemId(item.id);
	};
	const handleMerge = async () => {
		if (!mergeItemId || !fromRoomId || !intoRoomId || isMerging) return;
		setIsMerging(true);
		setMergeError("");
		try {
			await mergeChats(mergeItemId, fromRoomId, intoRoomId);
			closeMerge();
		} catch (cause) {
			setMergeError(errorText(cause));
		} finally {
			setIsMerging(false);
		}
	};

	if (reviewing) {
		return (
			<>
				{error ? (
					<P role="alert" className="mb-4 text-destructive text-sm">
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

	const withNext = mine.filter((item) => mineNext(item, isMine));
	const waiting = mine.filter((item) => waitingOn(item, isMine));
	const shown =
		view === "next" ? withNext : view === "waiting" ? waiting : mine;
	const waits = mine.flatMap((item) =>
		item.openSteps
			.filter((step) => !isMine(step))
			.map((step) => ({
				id: `${item.id}:${step.id}`,
				who: step.assigneeName ? givenFirst(step.assigneeName) : "",
				title: item.title,
				to: itemPath(item),
				text: step.text,
			})),
	);
	// one chip in the card's header when every item shares a topic, else a chip on each row
	const sharedTopic =
		mine.length > 1 &&
		mine.every((item) => item.topicId && item.topicId === mine[0].topicId)
			? mine[0]
			: null;
	const sources = [
		state.settings.sourcesJson.email && "mail",
		state.settings.sourcesJson.teams && "chats",
	]
		.filter(Boolean)
		.join(" and ");

	const show = (order: Item[]) =>
		setItems([...order, ...others, ...proposed]);
	const saveOrder = () => {
		setDragId(null);
		const taskIds = mine.map((i) => i.id);
		if (JSON.stringify(taskIds) !== dragFrom.current)
			void run(pixel("WorkReorderItems", { taskIds }));
	};
	/** The menu's move: the row trades places with a neighbour in the list as shown, and the new order is saved. */
	const move = (id: string, targetId: string) => {
		const order = placed(mine, id, targetId);
		show(order);
		void run(
			pixel("WorkReorderItems", { taskIds: order.map((i) => i.id) }),
		);
	};

	return (
		<>
			{error ? (
				<P role="alert" className="mb-4 text-destructive text-sm">
					{error}
				</P>
			) : null}
			{review.length ? (
				// items Brain found that nobody has looked at yet
				<Link
					to="/work/review"
					className="group mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-primary/10 p-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 sm:px-6 sm:py-5"
				>
					<span
						aria-hidden="true"
						className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-card"
					>
						<Inbox className="size-5" />
					</span>
					<span className="min-w-0 flex-1 basis-40">
						<span className="block font-medium text-lg">
							{review.length} new work item
							{review.length === 1 ? " is" : "s are"} ready to
							review
						</span>
						<span className="block text-muted-foreground text-sm">
							Found in your mail and chats. Choose what belongs on
							your list.
						</span>
					</span>
					{/* the blue is too dim to read on the dark card */}
					<span className="flex shrink-0 items-center gap-2 rounded-md bg-card px-4 py-2 font-medium text-primary text-sm dark:text-foreground">
						Review items
						<ArrowRight
							aria-hidden="true"
							className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
						/>
					</span>
				</Link>
			) : null}
			<div className="grid @5xl:grid-cols-12 grid-cols-1 gap-6">
				<div className="@5xl:col-span-8 min-w-0">
					<BriefPanel
						title="Your priorities"
						count={mine.length}
						detail={
							sharedTopic ? (
								<ItemTopicChip item={sharedTopic} />
							) : undefined
						}
					>
						{mine.length ? (
							<Tabs
								value={view}
								onValueChange={(value) => {
									if (
										value === "all" ||
										value === "next" ||
										value === "waiting"
									)
										setView(value);
								}}
								className="gap-0"
							>
								<div className="flex items-end justify-between gap-4 border-b">
									<TabsList className="h-auto justify-start gap-6 rounded-none bg-transparent p-0">
										{(
											[
												["all", "All work", mine],
												[
													"next",
													"Next steps",
													withNext,
												],
												["waiting", "Waiting", waiting],
											] as const
										).map(([value, label, rows]) => (
											<TabsTrigger
												key={value}
												value={value}
												ref={
													value === "waiting"
														? waitingTab
														: undefined
												}
												// an underlined tab instead of the pill: the line sits on the rule under the row
												className="-mb-px h-auto pointer-coarse:min-h-11 flex-none gap-2 rounded-none border-0 border-transparent border-b-2 px-0 pt-1 pb-3 font-normal text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground"
											>
												{/* the space is for the tab's spoken name; the gap spaces them on screen */}
												{label}{" "}
												<span className="text-xs tabular-nums">
													{rows.length}
												</span>
											</TabsTrigger>
										))}
									</TabsList>
									<span className="hidden shrink-0 items-center gap-1.5 pb-3 text-muted-foreground text-xs sm:flex">
										<ArrowUpDown
											aria-hidden="true"
											className="size-3.5"
										/>
										In your order
									</span>
								</div>
								<TabsContent value={view}>
									{shown.length ? (
										<ul
											aria-label="Your work items"
											className="divide-y divide-border"
										>
											{shown.map((item, index) => {
												const before = shown[index - 1];
												const after = shown[index + 1];
												return (
													<ItemRow
														key={item.id}
														item={item}
														isMine={isMine}
														showTopic={!sharedTopic}
														onRequestMerge={
															handleRequestMerge
														}
														onDragStart={() => {
															setDragId(item.id);
															dragFrom.current =
																JSON.stringify(
																	mine.map(
																		(i) =>
																			i.id,
																	),
																);
														}}
														onDragOver={() => {
															// over itself nothing moves, and this fires many times a second
															if (
																dragId &&
																dragId !==
																	item.id
															)
																show(
																	placed(
																		mine,
																		dragId,
																		item.id,
																	),
																);
														}}
														onDragEnd={saveOrder}
														onMoveUp={
															before
																? () =>
																		move(
																			item.id,
																			before.id,
																		)
																: undefined
														}
														onMoveDown={
															after
																? () =>
																		move(
																			item.id,
																			after.id,
																		)
																: undefined
														}
													/>
												);
											})}
										</ul>
									) : (
										<P className="py-6 text-muted-foreground text-sm">
											{EMPTY_VIEW[view]}
										</P>
									)}
								</TabsContent>
							</Tabs>
						) : (
							<P className="text-muted-foreground text-sm">
								{review.length
									? "Review the new items to start your list."
									: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
							</P>
						)}
						{others.length ? (
							<div className="border-t">
								<button
									type="button"
									aria-expanded={showOthers}
									onClick={() => setShowOthers((v) => !v)}
									className="flex w-full items-center gap-2 rounded-sm py-3 text-left text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
								>
									<ChevronDown
										aria-hidden="true"
										className={cn(
											"size-4 transition-transform motion-reduce:transition-none",
											showOthers && "rotate-180",
										)}
									/>
									{others.length} item
									{others.length === 1 ? "" : "s"} other
									people are driving
								</button>
								{showOthers ? (
									<ul
										aria-label="Work other people are driving"
										className="divide-y divide-border border-t"
									>
										{others.map((item) => (
											<ItemRow
												key={item.id}
												item={item}
												isMine={isMine}
												showTopic
												onRequestMerge={
													handleRequestMerge
												}
											/>
										))}
									</ul>
								) : null}
							</div>
						) : null}
						{mine.length ? (
							<div className="mt-auto flex flex-wrap justify-between gap-x-4 gap-y-1 border-t pt-4 text-muted-foreground text-xs">
								<span>
									{mine.length > 1
										? "Drag the handle to arrange your priorities, or use a row's menu"
										: ""}
								</span>
								<span className="tabular-nums">
									{mine.length} active work item
									{mine.length === 1 ? "" : "s"}
								</span>
							</div>
						) : null}
					</BriefPanel>
				</div>
				<div className="@5xl:col-span-4 min-w-0">
					<WorkWaitingOn
						waits={waits}
						// focusing a tab also selects it, and brings the list into view where the cards stack
						onViewAll={() => waitingTab.current?.focus()}
					/>
				</div>
			</div>
			<Link
				to="/brain/sources"
				className="mt-6 inline-flex min-h-6 items-center gap-2 rounded-sm text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
			>
				<Link2 aria-hidden="true" className="size-3.5" />
				{sources
					? `Connected to your ${sources}`
					: "Connect your mail and chats to find work items"}
			</Link>
			<Dialog
				open={mergeItem !== undefined}
				onOpenChange={(open) => {
					if (!open && !isMerging) closeMerge();
				}}
			>
				<DialogContent
					showCloseButton={!isMerging}
					onEscapeKeyDown={(event) => {
						if (isMerging) event.preventDefault();
					}}
					onInteractOutside={(event) => {
						if (isMerging) event.preventDefault();
					}}
				>
					<DialogHeader>
						<DialogTitle>Merge chats</DialogTitle>
						<DialogDescription>
							The messages of the first chat are added to the end
							of the second, and the first chat is removed from{" "}
							{mergeItem?.title}.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor={fromFieldId}>Chat to merge</Label>
						<Select
							value={fromRoomId}
							onValueChange={setFromRoomId}
							disabled={isMerging}
						>
							<SelectTrigger id={fromFieldId} className="w-full">
								<SelectValue placeholder="Choose a chat" />
							</SelectTrigger>
							<SelectContent>
								{mergeRooms.map((room, index) =>
									room.id === intoRoomId ? null : (
										<SelectItem
											key={room.id}
											value={room.id}
										>
											{chatLabel(
												room,
												index,
												mergeRooms.length,
											)}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor={intoFieldId}>Merge into</Label>
						<Select
							value={intoRoomId}
							onValueChange={setIntoRoomId}
							disabled={isMerging}
						>
							<SelectTrigger id={intoFieldId} className="w-full">
								<SelectValue placeholder="Choose a chat" />
							</SelectTrigger>
							<SelectContent>
								{mergeRooms.map((room, index) =>
									room.id === fromRoomId ? null : (
										<SelectItem
											key={room.id}
											value={room.id}
										>
											{chatLabel(
												room,
												index,
												mergeRooms.length,
											)}
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
					<P className="text-muted-foreground text-sm">
						This merge cannot be undone.
					</P>
					{mergeError ? (
						<Alert variant="destructive">
							<AlertDescription>{mergeError}</AlertDescription>
						</Alert>
					) : null}
					<DialogFooter className="flex-col sm:flex-row">
						<Button
							type="button"
							variant="outline"
							disabled={isMerging}
							onClick={closeMerge}
						>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={!fromRoomId || !intoRoomId || isMerging}
							onClick={() => void handleMerge()}
						>
							{isMerging ? "Merging..." : "Merge chats"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

/** The Work page and its review: the hero heading, then the owner's list or the items waiting for them. */
export function WorkItemsList({ review = false }: { review?: boolean }) {
	// a finished build remounts the list so it loads the new items
	const [version, setVersion] = useState(0);
	const onBuilt = useCallback(() => setVersion((v) => v + 1), []);
	return (
		<CollaborationHeroPage>
			{review ? (
				<CollaborationHeroHeader
					eyebrow={
						<Link
							to="/work"
							className="flex min-h-6 items-center gap-1.5 rounded-sm font-medium hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
						>
							<ArrowLeft aria-hidden="true" className="size-4" />
							Back to Work
						</Link>
					}
					title="Review new work."
					description="Keep what matters. Merge duplicates. Dismiss the rest."
				>
					<Mail aria-hidden="true" className="size-4" />
					Suggested from your mail and chats
				</CollaborationHeroHeader>
			) : (
				<CollaborationHeroHeader
					title="Your work, in focus."
					description="A clear view of what's next, and what's waiting."
				>
					<MailCheckStatus />
					<Separator
						orientation="vertical"
						className="data-[orientation=vertical]:h-4"
					/>
					<WorkBuildMenu onDone={onBuilt} />
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="pointer-coarse:min-h-11 text-foreground"
					>
						<Link to="/work/topics">
							<Tags aria-hidden="true" />
							Topics
						</Link>
					</Button>
				</CollaborationHeroHeader>
			)}
			<WorkItems key={version} review={review} />
		</CollaborationHeroPage>
	);
}
