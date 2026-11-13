import { ChevronDown, GripVertical } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Small,
} from "@semoss/ui/next";
import type { Room } from "@/features/collaboration/state/collaboration.types";
import { pixel } from "@/lib/pixel";
import { roomPath } from "@/lib/workspace-paths";
import { localDue, runBatch } from "../live/live-state";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationPageHeader } from "./collaboration-page-header";
import { CollaborationSurface } from "./collaboration-surface";
import { TaskContextView, useTaskContext } from "./task-context";
import { TopicChip as SharedTopicChip } from "./topic-chip";
import { WorkBuildMenu } from "./work-build-menu";

// The Work page: the outcomes the owner is driving (D25), in the owner's order.
// Items Brain infers wait in review until the owner adds, merges or dismisses them.

type Row = Record<string, unknown>;

export interface Step {
	id: string;
	text: string;
	status: string;
	kind?: string;
	assigneeId?: string;
	assigneeName?: string;
	/** When the step was made: how long an ask has been waiting. */
	createdAt?: string;
}

export interface Item {
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
	/** Every step on the item, done ones too; absent from older servers. */
	stepCount?: number;
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
		createdAt: str(row.createdAt) || undefined,
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
		stepCount:
			typeof row.stepCount === "number" ? row.stepCount : undefined,
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
export function ItemTopicChip({ item }: { item: Item }) {
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

function openRoom(navigate: ReturnType<typeof useNavigate>, item: Item) {
	void navigate(itemPath(item));
}

/** The first open step someone else owes the owner. */
export function waitingOn(item: Item, isMine: (step: Step) => boolean) {
	return item.openSteps.find((s) => !isMine(s));
}

/** One row: the item, your next step and who you are waiting on; drag to reorder, Open room to work it. */
function ItemRow({
	item,
	isMine,
	onRequestMerge,
	draggable,
	onDragStart,
	onDragOver,
	onDragEnd,
}: {
	item: Item;
	isMine: (step: Step) => boolean;
	onRequestMerge?: (item: Item) => void;
	draggable?: boolean;
	onDragStart?: () => void;
	onDragOver?: () => void;
	onDragEnd?: () => void;
}) {
	const navigate = useNavigate();
	const due = dueLabel(item.due);
	const next = mineNext(item, isMine);
	const waiting = waitingOn(item, isMine);
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
			className="group flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-accent md:px-6"
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
					<ItemTopicChip item={item} />
				</div>
				{next ? (
					<P className="truncate text-sm">
						<span className="text-muted-foreground">Next: </span>
						{next.text}
					</P>
				) : null}
				{waiting ? (
					<P className="truncate text-muted-foreground text-sm">
						Waiting on {waiting.assigneeName ?? "someone"}:{" "}
						{waiting.text}
					</P>
				) : null}
				{!next && !waiting ? (
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
			<div className="flex shrink-0 items-center gap-2">
				{rooms.length > 0 ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="sm"
								variant="outline"
								aria-label={`More chats for ${item.title}`}
							>
								Chats
								<ChevronDown aria-hidden="true" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<DropdownMenuItem
								onSelect={() =>
									void navigate(
										`/work/item/${encodeURIComponent(item.id)}`,
									)
								}
							>
								New chat
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							{rooms.map((room, index) => (
								<DropdownMenuItem
									key={room.id}
									onSelect={() =>
										void navigate(roomPath(room.id))
									}
								>
									<span className="truncate">
										{chatLabel(room, index, rooms.length)}
									</span>
								</DropdownMenuItem>
							))}
							{onRequestMerge && rooms.length > 1 ? (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onSelect={() => onRequestMerge(item)}
									>
										Merge chats...
									</DropdownMenuItem>
								</>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
				<Button
					size="sm"
					variant="outline"
					onClick={() => openRoom(navigate, item)}
				>
					Open room
				</Button>
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
			className="mt-3 overflow-hidden rounded-lg border bg-muted/30 sm:ml-5.5"
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
	const [expanded, setExpanded] = useState<string | null>(null);
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
				const targets = all.filter((other) => other.id !== item.id);
				// accepted work first; another new item is a second choice
				const targetGroups = [
					{
						label: "Your work",
						items: targets.filter((other) => !other.proposed),
					},
					{
						label: "Also new",
						items: targets.filter((other) => other.proposed),
					},
				];
				return (
					<li key={item.id} className="min-w-0 px-5 py-4 md:px-6">
						<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
							<div className="min-w-0 flex-1 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<button
										type="button"
										aria-expanded={expanded === item.id}
										aria-controls={`review-${item.id}-detail`}
										onClick={() =>
											setExpanded(
												expanded === item.id
													? null
													: item.id,
											)
										}
										className="flex min-w-0 items-center gap-1.5 break-words text-left font-medium text-base hover:underline focus-visible:outline-2 focus-visible:outline-ring"
									>
										<ChevronDown
											aria-hidden="true"
											className={cn(
												"size-4 shrink-0 text-muted-foreground transition-transform",
												expanded !== item.id &&
													"-rotate-90",
											)}
										/>
										{item.title}
									</button>
									<ItemTopicChip item={item} />
								</div>
								{next ? (
									<P className="pl-5.5 text-sm">
										<span className="text-muted-foreground">
											Next:{" "}
										</span>
										{next.text}
									</P>
								) : null}
								<Small className="block pl-5.5 text-muted-foreground">
									{item.openSteps.length} open step
									{item.openSteps.length === 1 ? "" : "s"}
									{item.mine ? "" : ", none assigned to you"}
									{expanded === item.id
										? ""
										: " \u00b7 expand for steps and threads"}
								</Small>
							</div>
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
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											size="sm"
											variant="ghost"
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
										{targetGroups.map((group, index) =>
											group.items.length ? (
												<DropdownMenuGroup
													key={group.label}
												>
													{index > 0 &&
													targetGroups[0].items
														.length ? (
														<DropdownMenuSeparator />
													) : null}
													<DropdownMenuLabel className="font-normal text-muted-foreground text-xs">
														{group.label}
													</DropdownMenuLabel>
													{group.items.map(
														(other) => (
															<DropdownMenuItem
																key={other.id}
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
						</div>
						{expanded === item.id ? (
							<ExpandedTask
								taskId={item.id}
								id={`review-${item.id}-detail`}
							/>
						) : null}
					</li>
				);
			})}
		</ul>
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

/** The owner's work items, or with review, the inferred ones waiting for the owner. */
export function WorkItems({ review: reviewing }: { review?: boolean }) {
	const { items, setItems, error, run, mergeChats, isMine } = useWorkItems();
	const [dragId, setDragId] = useState<string | null>(null);
	const dragFrom = useRef("");
	const [showOthers, setShowOthers] = useState(false);
	const [mergeItemId, setMergeItemId] = useState<string | null>(null);
	const [fromRoomId, setFromRoomId] = useState("");
	const [intoRoomId, setIntoRoomId] = useState("");
	const [isMerging, setIsMerging] = useState(false);
	const [mergeError, setMergeError] = useState("");
	const fromFieldId = useId();
	const intoFieldId = useId();

	if (items === null) {
		return (
			<div className="p-6">
				{error ? (
					<P className="text-destructive text-sm">{error}</P>
				) : (
					<Small className="text-muted-foreground">Loading...</Small>
				)}
			</div>
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
		const taskIds = mine.map((i) => i.id);
		if (JSON.stringify(taskIds) !== dragFrom.current)
			void run(pixel("WorkReorderItems", { taskIds }));
	};

	return (
		<>
			{error ? (
				<P className="px-5 pt-4 text-destructive text-sm md:px-6">
					{error}
				</P>
			) : null}
			{review.length ? (
				<div className="flex items-center gap-3 border-border border-b bg-muted/40 px-5 py-3 text-sm md:px-6">
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
			{mine.length ? (
				<ul
					aria-label="Your work items"
					className="divide-y divide-border"
				>
					{mine.map((item) => (
						<ItemRow
							key={item.id}
							item={item}
							isMine={isMine}
							onRequestMerge={handleRequestMerge}
							draggable
							onDragStart={() => {
								setDragId(item.id);
								dragFrom.current = JSON.stringify(
									mine.map((i) => i.id),
								);
							}}
							onDragOver={() => moveTo(item.id)}
							onDragEnd={saveOrder}
						/>
					))}
				</ul>
			) : (
				<P className="p-6 text-muted-foreground text-sm">
					{review.length
						? "Review the new items to start your list."
						: "No work items yet. They come from your mail and chats, or ask in chat to add one."}
				</P>
			)}
			{others.length ? (
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
									onRequestMerge={handleRequestMerge}
								/>
							))}
						</ul>
					) : null}
				</div>
			) : null}
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

export function WorkItemsList({ review = false }: { review?: boolean }) {
	// a finished build remounts the list so it loads the new items
	const [version, setVersion] = useState(0);
	const onBuilt = useCallback(() => setVersion((v) => v + 1), []);
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
							<>
								<WorkBuildMenu onDone={onBuilt} />
								<Button asChild variant="outline" size="sm">
									<Link to="/work/topics">Topics</Link>
								</Button>
							</>
						)
					}
				/>
			}
		>
			<WorkItems key={version} review={review} />
		</CollaborationSurface>
	);
}
