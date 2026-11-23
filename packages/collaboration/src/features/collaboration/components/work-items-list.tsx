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
	X,
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
	H3,
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
	toast,
} from "@semoss/ui/next";
import type { Room } from "@/features/collaboration/state/collaboration.types";
import { BriefPanel } from "@/features/dashboard/brief-panel";
import { MailCheckStatus } from "@/features/dashboard/mail-check-status";
import { givenFirst } from "@/lib/person-name";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { updateWorkStep, type WorkStepChange } from "../api/work-steps";
import { localDue, runBatch } from "../live/live-state";
import { threadPeople } from "../state/collaboration.selectors";
import {
	useCollaborationSession,
	useWorkChanged,
} from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";
import { offerStepUndo } from "../work-item-actions";
import { ClosedForYou } from "./closed-for-you";
import { CollaborationHeroHeader } from "./collaboration-hero-header";
import { CollaborationHeroPage } from "./collaboration-hero-page";
import { NewWorkItemDialog } from "./new-work-item-dialog";
import { TaskContextView, useTaskContext } from "./task-context";
import { type TaskStep, TaskStepRow, toTaskStep } from "./task-step-row";
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
	/** `active`, `waiting`, `blocked`, `done` or `dropped`. */
	status: string;
	/** The owner has an open step that is not from a conversation filed as for their information or waiting on someone else. */
	needsYou: boolean;
	topic?: string;
	topicId?: string;
	/** Every topic it sits under; the first of them is its main one. */
	topics?: { id: string; name: string }[];
	roomId?: string;
	rooms?: Room[];
	due?: string;
	/** When the item or one of its steps last changed. */
	updatedAt?: string;
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
		status: str(row.status),
		// an older server does not say, so every item of the owner's needs them
		needsYou: row.needsYou !== false,
		topic: primary ? str(primary.name) : undefined,
		topicId: primary ? str(primary.id) : undefined,
		topics: topics.map((t) => ({ id: str(t.id), name: str(t.name) })),
		roomId: str(row.roomId) || undefined,
		rooms: list(row.rooms).map(toRoom),
		due: str(row.due) || undefined,
		updatedAt: str(row.updatedAt) || undefined,
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

// an item nothing has touched for this long says so, with the way to close it one menu away
const QUIET_DAYS = 21;

/** How long ago the item last changed, when that is long enough to say; null otherwise. */
export function quietLabel(
	updatedAt?: string,
	now = Date.now(),
): string | null {
	if (!updatedAt) return null;
	const at = new Date(updatedAt.replace(" ", "T"));
	if (Number.isNaN(at.getTime())) return null;
	const days = Math.floor((now - at.getTime()) / 86_400_000);
	if (days < QUIET_DAYS) return null;
	return days < 60
		? `Quiet for ${Math.floor(days / 7)} weeks`
		: `Quiet for ${Math.floor(days / 30)} months`;
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

/** The topics an item sits under besides the one being looked at, so a topic's own page does not repeat itself. */
function ItemOtherTopics({
	item,
	exceptId,
}: {
	item: Item;
	exceptId?: string;
}) {
	const { state } = useCollaborationSession();
	const others = (item.topics ?? []).filter((t) => t.id !== exceptId);
	if (!others.length) return null;
	return (
		<>
			{others.map((t) => {
				const topic = state.topics.find((s) => s.id === t.id);
				return topic ? (
					<SharedTopicChip key={t.id} topic={topic} />
				) : (
					<span
						key={t.id}
						className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-sm"
					>
						{t.name}
					</span>
				);
			})}
		</>
	);
}

/** How many of what the server has were returned; a list is cut when a busy owner has more than it sends. */
export interface WorkTotals {
	workItems: number;
	looseSteps: number;
}

const numberOf = (value: unknown, fallback: number): number =>
	typeof value === "number" && Number.isFinite(value) ? value : fallback;

/** The work list data and the owner's actions on it; one topic's work when topicId is given. */
export function useWorkItems(topicId?: string) {
	const { actions } = useInsight();
	const [items, setItems] = useState<Item[] | null>(null);
	// steps that belong to no work item: a single ask on a conversation is usually one
	const [looseSteps, setLooseSteps] = useState<TaskStep[]>([]);
	const [totals, setTotals] = useState<WorkTotals>({
		workItems: 0,
		looseSteps: 0,
	});
	const [busyStepId, setBusyStepId] = useState("");
	const [selfId, setSelfId] = useState("");
	const [error, setError] = useState("");
	const { workVersion, markWorkChanged } = useWorkChanged();
	// the version this list's own change made, whose reload it has already done
	const ownVersion = useRef(-1);
	const seenVersion = useRef(workVersion);

	const load = useCallback(async () => {
		try {
			// includeSuggested: the assistant's own loose steps are the owner's to see too
			const [out] = (await runBatch(actions, [
				pixel("WorkListMyWork", {
					includeSuggested: true,
					...(topicId ? { topicId } : {}),
				}),
			])) as Row[];
			const workItems = list(out?.workItems).map(toItem);
			const loose = list(out?.looseSteps).map(toTaskStep);
			setItems(workItems);
			setLooseSteps(loose);
			setTotals({
				workItems: numberOf(out?.workItemTotal, workItems.length),
				looseSteps: numberOf(out?.looseStepTotal, loose.length),
			});
			setSelfId(str(out?.selfId));
			setError("");
		} catch (cause) {
			setError(errorText(cause));
		}
	}, [actions, topicId]);

	useEffect(() => {
		// another view changed work: read the list again
		const isNewVersion = seenVersion.current !== workVersion;
		seenVersion.current = workVersion;
		if (isNewVersion && ownVersion.current === workVersion) return;
		void load();
	}, [load, workVersion]);

	/** Runs the statements as one request, reads the list again, and tells the other views once. */
	const runAll = useCallback(
		async (statements: string[]): Promise<boolean> => {
			try {
				await runBatch(actions, statements);
				await load();
				// the cards and other lists read their own copy of work
				ownVersion.current = markWorkChanged();
				return true;
			} catch (cause) {
				setError(errorText(cause));
				return false;
			}
		},
		[actions, load, markWorkChanged],
	);
	const run = useCallback(
		(statement: string): Promise<boolean> => runAll([statement]),
		[runAll],
	);

	/** The owner's change to one loose step; a step taken off the list can be put back from the toast. */
	const changeStep = useCallback(
		async (stepId: string, change: WorkStepChange) => {
			setBusyStepId(stepId);
			const isSaved = await runAll([
				pixel("WorkUpdateStep", { stepId, ...change }),
			]);
			setBusyStepId("");
			if (!isSaved) return;
			offerStepUndo(change, async () => {
				try {
					await updateWorkStep(actions, stepId, {
						status: "open",
						// "not mine" was only the reason it was set aside
						note: change.note === undefined ? undefined : "",
					});
					await load();
					ownVersion.current = markWorkChanged();
				} catch (cause) {
					setError(errorText(cause));
				}
			});
		},
		[actions, load, markWorkChanged, runAll],
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

	return {
		items,
		setItems,
		looseSteps,
		totals,
		busyStepId,
		error,
		run,
		mergeChats,
		runAll,
		changeStep,
		selfId,
		isMine,
	};
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
	onClose,
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
	/** Closes the item as finished or as no longer wanted. */
	onClose?: (status: "done" | "dropped") => void;
}) {
	const draggable = Boolean(onDragStart);
	const due = dueLabel(item.due);
	const quiet = quietLabel(item.updatedAt);
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
								{onClose ? (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onSelect={() => onClose("done")}
										>
											Mark done
										</DropdownMenuItem>
										<DropdownMenuItem
											onSelect={() => onClose("dropped")}
										>
											Drop
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
								waiting.text.trim().toLowerCase() ===
								item.title.trim().toLowerCase() ? (
									<span className="font-medium text-foreground">
										Waiting on{" "}
										{waiting.assigneeName
											? givenFirst(waiting.assigneeName)
											: "someone"}
									</span>
								) : (
									<>
										<span className="font-medium text-foreground">
											Waiting on{" "}
											{waiting.assigneeName
												? givenFirst(
														waiting.assigneeName,
													)
												: "someone"}
											:
										</span>{" "}
										{waiting.text}
									</>
								)
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
					{quiet ? (
						<span className="shrink-0 text-muted-foreground text-xs">
							{quiet}
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
	const { task, loading, error, steps } = useTaskContext({ taskId });
	return (
		<div
			id={id}
			className="mt-3 overflow-hidden rounded-lg border bg-muted/30 sm:ml-6"
		>
			{task ? (
				<TaskContextView task={task} steps={steps} />
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
	run,
	runAll,
	undoDismiss,
	topicId,
}: {
	items: Item[];
	all: Item[];
	/** The topic whose page this is; "Not about" and "Move to" act on it. */
	topicId?: string;
	run: (statement: string) => Promise<boolean>;
	/** Runs the statements as one request. */
	runAll: (statements: string[]) => Promise<boolean>;
	/** Puts a dismissed item back among the new ones. */
	undoDismiss: (taskId: string) => void;
}) {
	const { state } = useCollaborationSession();
	// the topic a row is moved or taken off: this page's, else its main one
	const from = (item: Item) => topicId ?? item.topicId;
	// the row whose own request is in flight, so its buttons wait
	const [busyId, setBusyId] = useState("");
	const [pendingBatch, setPendingBatch] = useState<Item[] | null>(null);
	const [isBatchSaving, setIsBatchSaving] = useState(false);
	const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
	const [topic, setTopic] = useState(ALL_TOPICS);
	const [showAside, setShowAside] = useState(false);
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
	// what needs the owner leads; set-aside items and others' work wait behind a toggle
	const focus = shown.filter((item) => item.mine && item.needsYou);
	const aside = shown.filter((item) => !(item.mine && item.needsYou));
	const visible = showAside || !focus.length ? [...focus, ...aside] : focus;
	const isAllOpen =
		shown.length > 0 && shown.every((item) => expanded.has(item.id));
	const accept = (item: Item) =>
		pixel("WorkSaveWork", { taskId: item.id, accept: true });
	/** Runs one row's request with that row's buttons disabled meanwhile; resolves whether it saved. */
	const act = async (id: string, statement: string): Promise<boolean> => {
		setBusyId(id);
		try {
			return await run(statement);
		} finally {
			setBusyId("");
		}
	};
	const handleAddAll = async () => {
		if (!pendingBatch) return;
		setIsBatchSaving(true);
		await runAll(pendingBatch.map(accept));
		setIsBatchSaving(false);
		setPendingBatch(null);
	};

	return (
		<BriefPanel
			dense={Boolean(topicId)}
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
							variant="secondary"
							className="pointer-coarse:min-h-11"
							onClick={() => setPendingBatch(items)}
						>
							Add all {items.length} to my work
						</Button>
						{shownTopic !== ALL_TOPICS ? (
							<Button
								size="sm"
								variant="secondary"
								className="pointer-coarse:min-h-11"
								onClick={() => setPendingBatch(shown)}
							>
								Add all in this topic
							</Button>
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
				<>
					<ul
						aria-label="New work items"
						className="divide-y divide-border"
					>
						{visible.map((item) => {
							const isOpen = expanded.has(item.id);
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
									className="min-w-0 py-3 first:pt-0"
								>
									<div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
										<div className="min-w-0 flex-1 space-y-1.5">
											<button
												type="button"
												aria-expanded={isOpen}
												aria-controls={`review-${item.id}-detail`}
												onClick={() =>
													setExpanded((open) => {
														const next = new Set(
															open,
														);
														if (
															!next.delete(
																item.id,
															)
														)
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
											<div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-muted-foreground text-xs">
												<ItemOtherTopics
													item={item}
													exceptId={topicId}
												/>
												<span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
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
												{item.mine ? (
													item.needsYou ? null : (
														<span>
															Set aside: for your
															information,
															waiting, or from
															someone new
														</span>
													)
												) : (
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
												disabled={busyId === item.id}
												onClick={() =>
													void act(
														item.id,
														accept(item),
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
														size="icon-sm"
														variant="ghost"
														aria-label="Change topic"
														title="Change topic"
														className="pointer-coarse:size-11 text-muted-foreground"
														disabled={
															busyId === item.id
														}
													>
														<Tags aria-hidden="true" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="end"
													className="max-h-80 w-72 overflow-y-auto"
												>
													{state.topics.some(
														(t) =>
															t.status !==
																"archived" &&
															t.id !== from(item),
													) ? (
														<DropdownMenuGroup>
															<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
																Move to topic
															</DropdownMenuLabel>
															{state.topics
																.filter(
																	(t) =>
																		t.status !==
																			"archived" &&
																		t.id !==
																			from(
																				item,
																			),
																)
																.map((t) => (
																	<DropdownMenuItem
																		key={
																			t.id
																		}
																		className="gap-2"
																		onSelect={() =>
																			void act(
																				item.id,
																				pixel(
																					"WorkSaveWork",
																					{
																						taskId: item.id,
																						topicIds:
																							[
																								t.id,
																							],
																						removeTopicIds:
																							from(
																								item,
																							)
																								? [
																										from(
																											item,
																										) as string,
																									]
																								: undefined,
																					},
																				),
																			)
																		}
																	>
																		<span
																			aria-hidden="true"
																			className={cn(
																				"size-2 shrink-0 rounded-xs",
																				topicTone(
																					t.id,
																				),
																			)}
																		/>
																		<span className="line-clamp-2 break-words">
																			{
																				t.name
																			}
																		</span>
																	</DropdownMenuItem>
																))}
														</DropdownMenuGroup>
													) : null}
													{from(item) ? (
														<>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																onSelect={() =>
																	void act(
																		item.id,
																		pixel(
																			"WorkSaveWork",
																			{
																				taskId: item.id,
																				removeTopicIds:
																					[
																						from(
																							item,
																						) as string,
																					],
																			},
																		),
																	)
																}
															>
																Not about{" "}
																{state.topics.find(
																	(t) =>
																		t.id ===
																		from(
																			item,
																		),
																)?.name ??
																	"this topic"}
															</DropdownMenuItem>
														</>
													) : null}
												</DropdownMenuContent>
											</DropdownMenu>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														size="sm"
														variant="ghost"
														className="pointer-coarse:min-h-11"
														disabled={
															!targets.length ||
															busyId === item.id
														}
													>
														Merge
														<ChevronDown aria-hidden="true" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent
													align="end"
													className="max-h-80 w-72 overflow-y-auto"
												>
													{targetGroups.map(
														(group, index) =>
															group.items
																.length ? (
																<DropdownMenuGroup
																	key={
																		group.label
																	}
																>
																	{index >
																		0 &&
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
																		(
																			other,
																		) => (
																			<DropdownMenuItem
																				key={
																					other.id
																				}
																				className="flex-col items-start gap-0.5"
																				onSelect={() =>
																					void act(
																						item.id,
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
												size="icon-sm"
												variant="ghost"
												aria-label="Dismiss"
												title="Dismiss"
												className="pointer-coarse:size-11 text-muted-foreground"
												disabled={busyId === item.id}
												onClick={async () => {
													const isSaved = await act(
														item.id,
														pixel("WorkSaveWork", {
															taskId: item.id,
															status: "dropped",
														}),
													);
													// a dismissed new item is dropped but still new, so active puts it back in review
													if (isSaved)
														toast(
															"Work item dismissed.",
															{
																action: {
																	label: "Undo",
																	onClick:
																		() =>
																			undoDismiss(
																				item.id,
																			),
																},
															},
														);
												}}
											>
												<X aria-hidden="true" />
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
					{focus.length && aside.length ? (
						<button
							type="button"
							aria-expanded={showAside}
							onClick={() => setShowAside((v) => !v)}
							className="flex w-full items-center gap-2 rounded-sm border-t py-3 text-left text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
						>
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-4 transition-transform motion-reduce:transition-none",
									showAside && "rotate-180",
								)}
							/>
							{showAside
								? "Show only what needs you"
								: `${aside.length} more set aside or not assigned to you`}
						</button>
					) : null}
				</>
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
			<Dialog
				open={pendingBatch !== null}
				onOpenChange={(open) => {
					if (!open && !isBatchSaving) setPendingBatch(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Add {pendingBatch?.length ?? 0} work item
							{pendingBatch?.length === 1 ? "" : "s"} to your
							list?
						</DialogTitle>
						<DialogDescription>
							They move from review to your work. You can still
							change or remove each one later.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={isBatchSaving}
							onClick={() => setPendingBatch(null)}
						>
							Cancel
						</Button>
						<Button
							disabled={isBatchSaving}
							onClick={() => void handleAddAll()}
						>
							{isBatchSaving ? "Adding..." : "Add to my work"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</BriefPanel>
	);
}

/** The items to review, the owner's own and the ones someone else is driving. */
export function split(items: Item[]) {
	const kept = items.filter((i) => !i.proposed);
	const proposed = items.filter((i) => i.proposed);
	const mine = kept.filter((i) => i.mine);
	return {
		// the owner's items in two groups, each in the owner's order
		needsYou: mine.filter((i) => i.needsYou),
		alsoAsked: mine.filter((i) => !i.needsYou),
		// the owner's own first, then the rest someone else is driving
		review: [
			// what needs the owner first, then what the inbox filed as for their information or waiting
			...proposed.filter((i) => i.mine && i.needsYou),
			...proposed.filter((i) => i.mine && !i.needsYou),
			...proposed.filter((i) => !i.mine),
		],
		proposed,
		mine,
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

/** The quiet line under a list the server cut short. */
function CutShort({ shown, total }: { shown: number; total: number }) {
	return total > shown ? (
		<P className="text-muted-foreground text-xs">
			Showing the first {shown} of {total}.
		</P>
	) : null;
}

/** Finished work items, read when the owner opens the section; each can be reopened. */
function DoneWork() {
	const { actions } = useInsight();
	const { workVersion, markWorkChanged } = useWorkChanged();
	const [isOpen, setIsOpen] = useState(false);
	const [done, setDone] = useState<Item[] | null>(null);
	const [error, setError] = useState("");
	const [busyId, setBusyId] = useState("");
	useEffect(() => {
		// reads again when work changes elsewhere while the section is open
		if (!isOpen || workVersion < 0) return;
		let live = true;
		runBatch(actions, [pixel("WorkListMyWork", { status: "done" })])
			.then(([out]) => {
				if (!live) return;
				// the server's closed list also holds dismissed items
				setDone(
					list((out as Row | undefined)?.workItems)
						.map(toItem)
						.filter((item) => item.status === "done"),
				);
				setError("");
			})
			.catch((cause) => live && setError(errorText(cause)));
		return () => {
			live = false;
		};
	}, [actions, isOpen, workVersion]);
	const reopen = async (item: Item) => {
		setBusyId(item.id);
		try {
			await runBatch(actions, [
				pixel("WorkSaveWork", { taskId: item.id, status: "active" }),
			]);
			setDone(
				(current) => current?.filter((d) => d.id !== item.id) ?? null,
			);
			markWorkChanged();
		} catch (cause) {
			setError(errorText(cause));
		} finally {
			setBusyId("");
		}
	};
	return (
		<section aria-label="Done work" className="mt-6 border-t">
			<button
				type="button"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((v) => !v)}
				className="flex w-full items-center gap-2 rounded-sm py-3 text-left text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
			>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 transition-transform motion-reduce:transition-none",
						isOpen && "rotate-180",
					)}
				/>
				Done
			</button>
			{isOpen ? (
				error ? (
					<P role="alert" className="text-destructive text-sm">
						{error}
					</P>
				) : done === null ? (
					<P className="text-muted-foreground text-sm">Loading...</P>
				) : done.length ? (
					<ul
						aria-label="Done work items"
						className="divide-y divide-border border-t"
					>
						{done.map((item) => (
							<li
								key={item.id}
								className="flex items-center gap-3 py-3"
							>
								<Link
									to={itemPath(item)}
									className="wrap-anywhere min-w-0 flex-1 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-ring"
								>
									{item.title}
								</Link>
								<Button
									size="sm"
									variant="outline"
									disabled={busyId === item.id}
									aria-label={`Reopen ${item.title}`}
									onClick={() => void reopen(item)}
								>
									Reopen
								</Button>
							</li>
						))}
					</ul>
				) : (
					<P className="text-muted-foreground text-sm">
						Nothing finished yet.
					</P>
				)
			) : null}
		</section>
	);
}

/** The owner's work items, or with review, the inferred ones waiting for the owner. */
export function WorkItems({
	review: reviewing,
	topicId,
}: {
	review?: boolean;
	/** One topic's work, on its page: new items are reviewed in place, and the owner's order is kept on Work. */
	topicId?: string;
}) {
	const { state } = useCollaborationSession();
	const {
		items,
		setItems,
		looseSteps,
		totals,
		busyStepId,
		error,
		run,
		mergeChats,
		runAll,
		changeStep,
		selfId,
		isMine,
	} = useWorkItems(topicId);
	const canOrder = !topicId;
	const [dragId, setDragId] = useState<string | null>(null);
	const dragFrom = useRef("");
	const [showOthers, setShowOthers] = useState(false);
	// single steps fold away on a topic's page, where its work items lead
	const [showSteps, setShowSteps] = useState(false);
	const [showTopicReview, setShowTopicReview] = useState(false);
	const [showTopicWaiting, setShowTopicWaiting] = useState(false);
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
	const { review, proposed, mine, others, needsYou, alsoAsked } =
		split(items);
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
					topicId={topicId}
					items={review}
					all={items}
					run={run}
					runAll={runAll}
					undoDismiss={(taskId) =>
						void run(
							pixel("WorkSaveWork", { taskId, status: "active" }),
						)
					}
				/>
			</>
		);
	}

	const withNext = mine.filter((item) => mineNext(item, isMine));
	const waiting = mine.filter((item) => waitingOn(item, isMine));
	/** The part of a group the chosen tab shows. */
	const inView = (group: Item[]) =>
		view === "next"
			? group.filter((item) => mineNext(item, isMine))
			: view === "waiting"
				? group.filter((item) => waitingOn(item, isMine))
				: group;
	const shownNeedsYou = inView(needsYou);
	const shownAlsoAsked = inView(alsoAsked);
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

	/** A group's heading with its count, and a line saying what it is when it needs one. */
	const groupHeading = (title: string, count: number, note?: string) => (
		<div className="pt-4">
			<div className="flex items-center gap-3">
				<H3 className="text-base leading-tight">{title}</H3>
				<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground text-sm tabular-nums">
					{count}
				</span>
			</div>
			{note ? (
				<P className="mt-1 text-muted-foreground text-sm">{note}</P>
			) : null}
		</div>
	);
	/** Closes an item from its row; the toast puts it back. */
	const close = async (item: Item, status: "done" | "dropped") => {
		const isSaved = await run(
			pixel("WorkSaveWork", { taskId: item.id, status }),
		);
		if (!isSaved) return;
		toast(
			status === "done"
				? `"${item.title}" marked done.`
				: `"${item.title}" dropped.`,
			{
				action: {
					label: "Undo",
					onClick: () =>
						void run(
							pixel("WorkSaveWork", {
								taskId: item.id,
								status: item.status || "active",
							}),
						),
				},
			},
		);
	};
	/** One group's rows, which drag and move inside the group. */
	const rows = (groupRows: Item[], label: string) => (
		<ul aria-label={label} className="divide-y divide-border">
			{groupRows.map((item, index) => {
				const before = groupRows[index - 1];
				const after = groupRows[index + 1];
				return (
					<ItemRow
						key={item.id}
						item={item}
						isMine={isMine}
						showTopic={!sharedTopic && !topicId}
						onDragStart={
							canOrder
								? () => {
										setDragId(item.id);
										dragFrom.current = JSON.stringify(
											mine.map((i) => i.id),
										);
									}
								: undefined
						}
						onDragOver={() => {
							// over itself nothing moves, and this fires many times a second
							if (
								dragId &&
								dragId !== item.id &&
								groupRows.some((row) => row.id === dragId)
							)
								show(placed(mine, dragId, item.id));
						}}
						onDragEnd={canOrder ? saveOrder : undefined}
						onMoveUp={
							canOrder && before
								? () => move(item.id, before.id)
								: undefined
						}
						onMoveDown={
							canOrder && after
								? () => move(item.id, after.id)
								: undefined
						}
						onRequestMerge={handleRequestMerge}
						onClose={(status) => void close(item, status)}
					/>
				);
			})}
		</ul>
	);

	/** One group of single steps, each with the same controls as a step inside a work item. */
	const stepGroup = (title: string, steps: TaskStep[], note?: string) =>
		steps.length ? (
			<section aria-label={title}>
				{groupHeading(title, steps.length, note)}
				<ul
					aria-label={`Single steps: ${title}`}
					className="divide-y divide-border overflow-hidden rounded-lg border bg-background"
				>
					{steps.map((step) => (
						<TaskStepRow
							key={step.id}
							step={{
								...step,
								threadSubject: state.threads.find(
									(t) => t.id === step.threadId,
								)?.subject,
							}}
							state="mine"
							selfId={selfId}
							people={threadPeople(state, step.threadId)}
							onChange={(stepId, change) =>
								void changeStep(stepId, change)
							}
							isBusy={busyStepId === step.id}
							topicName={
								// on its own topic's page the step's topic goes without saying
								step.topicId && step.topicId !== topicId
									? state.topics.find(
											(t) => t.id === step.topicId,
										)?.name
									: undefined
							}
						/>
					))}
				</ul>
			</section>
		) : null;
	const asideSteps = looseSteps.filter(
		(step) =>
			step.inbox === "fyi" ||
			step.inbox === "waiting" ||
			step.inbox === "outside",
	);
	const needSteps = looseSteps.filter((step) => !asideSteps.includes(step));
	const singleSteps = looseSteps.length ? (
		<section
			aria-label="Single steps"
			className="mt-6 space-y-2 rounded-xl border bg-card px-5 py-4"
		>
			<H3 className="text-base leading-tight">
				<button
					type="button"
					aria-expanded={showSteps}
					onClick={() => setShowSteps((v) => !v)}
					className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring"
				>
					<ChevronDown
						aria-hidden="true"
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
							!showSteps && "-rotate-90",
						)}
					/>
					Single steps
					<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs tabular-nums">
						{looseSteps.length}
					</span>
					<span className="font-normal text-muted-foreground text-sm">
						Asks that are not part of a work item
					</span>
				</button>
			</H3>
			{showSteps ? (
				<>
					{stepGroup("Needs you", needSteps)}
					{stepGroup(
						"Also asked of you",
						asideSteps,
						"From conversations filed as for your information or waiting on someone else, or from people you have not worked with.",
					)}
					<CutShort
						shown={looseSteps.length}
						total={totals.looseSteps}
					/>
				</>
			) : null}
		</section>
	) : null;

	return (
		<>
			{error ? (
				<P role="alert" className="mb-4 text-destructive text-sm">
					{error}
				</P>
			) : null}
			{!topicId && review.length ? (
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
			<div
				className={cn(
					"grid grid-cols-1 gap-6",
					!topicId && "@5xl:grid-cols-12",
				)}
			>
				<div className={cn("min-w-0", !topicId && "@5xl:col-span-8")}>
					{/* its own block: the panel fills its parent, and the column also holds the lists below it */}
					<div>
						<BriefPanel
							title={
								topicId
									? "Work on this topic"
									: "Your priorities"
							}
							count={mine.length}
							plain={Boolean(topicId)}
							hideHeader={Boolean(topicId)}
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
									{(!topicId || mine.length > 1) && (
										<div className="flex items-end justify-between gap-4 border-b">
											<TabsList className="h-auto justify-start gap-6 rounded-none bg-transparent p-0">
												{(
													[
														[
															"all",
															"All work",
															mine,
														],
														[
															"next",
															"Next steps",
															withNext,
														],
														[
															"waiting",
															"Waiting",
															waiting,
														],
													] as const
												).map(
													([value, label, rows]) => (
														<TabsTrigger
															key={value}
															value={value}
															ref={
																value ===
																"waiting"
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
													),
												)}
											</TabsList>
											<span
												className={cn(
													"hidden shrink-0 items-center gap-1.5 pb-3 text-muted-foreground text-xs",
													canOrder && "sm:flex",
												)}
											>
												<ArrowUpDown
													aria-hidden="true"
													className="size-3.5"
												/>
												In your order
											</span>
										</div>
									)}
									<TabsContent value={view}>
										{shownNeedsYou.length ||
										shownAlsoAsked.length ? (
											<>
												{shownNeedsYou.length ||
												view === "all" ? (
													<section aria-label="Needs you">
														{!topicId ||
														shownAlsoAsked.length >
															0
															? groupHeading(
																	"Needs you",
																	shownNeedsYou.length,
																)
															: null}
														{shownNeedsYou.length ? (
															rows(
																shownNeedsYou,
																"Your work items",
															)
														) : (
															<P className="py-4 text-muted-foreground text-sm">
																Nothing needs
																you right now.
															</P>
														)}
													</section>
												) : null}
												{shownAlsoAsked.length ? (
													<section aria-label="Also asked of you">
														{groupHeading(
															"Also asked of you",
															shownAlsoAsked.length,
															"From conversations filed as for your information or waiting on someone else, or from people you have not worked with.",
														)}
														{rows(
															shownAlsoAsked,
															"Also asked of you",
														)}
													</section>
												) : null}
											</>
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
										? topicId
											? "Nothing kept yet. Review the new items below to start this topic's list."
											: "Review the new items to start your list."
										: topicId
											? "No work items on this topic yet. They come from its mail and chats, or ask in chat to add one."
											: looseSteps.length
												? "No work items yet. Your single steps are below."
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
							<CutShort
								shown={items.length}
								total={totals.workItems}
							/>
							{mine.length && (!topicId || mine.length > 1) ? (
								<div className="mt-auto flex flex-wrap justify-between gap-x-4 gap-y-1 border-t pt-4 text-muted-foreground text-xs">
									<span>
										{mine.length > 1 && canOrder
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
					{review.length && topicId ? (
						// on a topic page its new items stay tucked until opened so active work and the assistant stay visible
						<section
							aria-label="Suggested work items to review"
							className="mt-4 space-y-3"
						>
							<button
								type="button"
								aria-expanded={showTopicReview}
								onClick={() => setShowTopicReview((v) => !v)}
								className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-ring"
							>
								<ChevronDown
									aria-hidden="true"
									className={cn(
										"size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
										!showTopicReview && "-rotate-90",
									)}
								/>
								<span className="font-medium text-sm">
									{review.length} suggested work{" "}
									{review.length === 1 ? "item" : "items"} to
									review
								</span>
								<span className="text-muted-foreground text-xs">
									From this topic&apos;s mail and chats
								</span>
							</button>
							{showTopicReview ? (
								<ReviewList
									topicId={topicId}
									items={review}
									all={items}
									run={run}
									runAll={runAll}
									undoDismiss={(taskId) =>
										void run(
											pixel("WorkSaveWork", {
												taskId,
												status: "active",
											}),
										)
									}
								/>
							) : null}
						</section>
					) : null}
					{singleSteps}
					{topicId && waits.length ? (
						<section
							aria-label="Waiting on"
							className="mt-4 space-y-3 rounded-xl border bg-card px-5 py-4"
						>
							<H3 className="text-base leading-tight">
								<button
									type="button"
									aria-expanded={showTopicWaiting}
									onClick={() =>
										setShowTopicWaiting((v) => !v)
									}
									className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring"
								>
									<ChevronDown
										aria-hidden="true"
										className={cn(
											"size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
											!showTopicWaiting && "-rotate-90",
										)}
									/>
									Waiting on
									<span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs tabular-nums">
										{waits.length}
									</span>
									<span className="font-normal text-muted-foreground text-sm">
										The handoffs behind your work
									</span>
								</button>
							</H3>
							{showTopicWaiting ? (
								<WorkWaitingOn
									waits={waits}
									onViewAll={() =>
										waitingTab.current?.focus()
									}
								/>
							) : null}
						</section>
					) : null}
					{topicId ? null : (
						<>
							<DoneWork />
							<ClosedForYou />
						</>
					)}
				</div>
				{topicId ? null : (
					<div className="@5xl:col-span-4 min-w-0">
						<WorkWaitingOn
							waits={waits}
							// focusing a tab also selects it, and brings the list into view where the cards stack
							onViewAll={() => waitingTab.current?.focus()}
						/>
					</div>
				)}
			</div>
			{topicId ? null : (
				<Link
					to="/brain/sources"
					className="mt-6 inline-flex min-h-6 items-center gap-2 rounded-sm text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
				>
					<Link2 aria-hidden="true" className="size-3.5" />
					{sources
						? `Connected to your ${sources}`
						: "Connect your mail and chats to find work items"}
				</Link>
			)}
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
					<WorkBuildMenu />
					<NewWorkItemDialog />
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
			<WorkItems review={review} />
		</CollaborationHeroPage>
	);
}
