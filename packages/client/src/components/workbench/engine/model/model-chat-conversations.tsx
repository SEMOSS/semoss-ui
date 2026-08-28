import {
	ArrowUpDownIcon,
	CheckIcon,
	HistoryIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { ConversationRoom } from "@/api/rooms";
import { getUserConversationRooms } from "@/api/rooms";
import { useModelChat, useWorkbenchControl } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import { roomScopeToken } from "@/stores/workbench/model";
import { formatSessionDate } from "../../assistant/workbench-assistant-format";
import { ModelChatHistoryRefreshControl } from "./model-chat-history-refresh-control";

/** Rows fetched per page. Scrolling to the bottom asks for the next one. */
const PAGE_SIZE = 50;

/**
 * How the list is ordered. A direction only, because that is all
 * `GetUserConversationRooms` accepts — it hardcodes the column to
 * `ROOM__DATE_CREATED`. Sorting has to be the backend's job here: with paging,
 * a client-side sort would only order the rows already fetched, so there is no
 * name option until the reactor can order by one.
 */
type ConversationSort = "DESC" | "ASC";

/** The orderings offered, in the order they are listed. */
const SORT_OPTIONS: { value: ConversationSort; label: string }[] = [
	{ value: "DESC", label: "Newest first" },
	{ value: "ASC", label: "Oldest first" },
];

/**
 * The api this panel publishes on its scratch `value` so its chrome control
 * can drive it. A control renders in the chrome's subtree and cannot see the
 * panel's local state, so behaviour has to travel through the store this way.
 */
export interface ModelChatHistoryApi {
	/** Reload the list from the first page. */
	refresh: () => void;
}

/**
 * Conversation history for this model: a searchable, sortable, paged list of
 * the user's previous rooms, with inline rename and delete.
 *
 * The list lives here rather than in the chat store — it is this panel's own
 * view state, and nothing else reads it. Only the actions that change the
 * *active* conversation (resume, rename, delete) go through the store.
 *
 * @name ModelChatConversations
 * @return The conversation history panel body.
 */
export const ModelChatConversations: WorkbenchComponent<
	Record<string, unknown>,
	ModelChatHistoryApi
> = ({ id, setValue }) => {
	const insightId = useModelChat((state) => state.insightId);
	const engineId = useModelChat((state) => state.engineId);
	const activeRoomId = useModelChat((state) => state.roomId);
	const activeRoomName = useModelChat((state) => state.roomName);
	const resumeRoom = useModelChat((state) => state.resumeRoom);
	const renameRoom = useModelChat((state) => state.renameRoom);
	const deleteConversation = useModelChat(
		(state) => state.deleteConversation,
	);
	const newRoom = useModelChat((state) => state.newRoom);

	const [rooms, setRooms] = useState<ConversationRoom[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(false);
	const [search, setSearch] = useState("");
	const [sort, setSort] = useState<ConversationSort>("DESC");

	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	const [draftRoomName, setDraftRoomName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);
	const [confirmingRoomId, setConfirmingRoomId] = useState<string | null>(
		null,
	);

	const debouncedSearch = useDebouncedValue(search, 300);

	// Guards an append against a reset that landed while it was in flight —
	// without it, a page from the previous query interleaves with the new one.
	const requestRef = useRef(0);

	const activeSortLabel =
		SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "";

	/**
	 * Fetch one page and merge it in. `offset` 0 replaces the list, anything
	 * else appends. The backend reports no total, so "there may be more" is
	 * inferred from the page coming back full.
	 */
	const fetchPage = useCallback(
		async (offset: number) => {
			if (!insightId) return;

			const requestId =
				offset === 0 ? requestRef.current + 1 : requestRef.current;
			if (offset === 0) requestRef.current = requestId;

			if (offset === 0) {
				setIsLoading(true);
			} else {
				setIsLoadingMore(true);
			}

			try {
				const page = await getUserConversationRooms(
					insightId,
					roomScopeToken(engineId),
					{
						nameSearch: debouncedSearch || undefined,
						sort,
						limit: PAGE_SIZE,
						offset,
					},
				);

				if (requestId !== requestRef.current) return;

				setRooms((current) =>
					offset === 0 ? page : [...current, ...page],
				);
				setHasMore(page.length === PAGE_SIZE);
			} catch (error) {
				console.warn("Failed to load conversation history:", error);
			} finally {
				if (offset === 0) {
					setIsLoading(false);
				} else {
					setIsLoadingMore(false);
				}
			}
		},
		[insightId, engineId, debouncedSearch, sort],
	);

	// Reload whenever the query changes, and whenever the active room changes
	// or is auto-named — the panel is keepAlive, so nothing else would.
	// biome-ignore lint/correctness/useExhaustiveDependencies: activeRoomId/activeRoomName are refresh triggers, not values the effect reads
	useEffect(() => {
		void fetchPage(0);
	}, [fetchPage, activeRoomId, activeRoomName]);

	// Behaviour, not state: the control calls refresh() and never re-renders
	// with this panel, so it only ever sees a stable function.
	// biome-ignore lint/correctness/useExhaustiveDependencies: setValue is rebuilt whenever `value` changes, so depending on it loops
	useEffect(() => {
		setValue({ refresh: () => void fetchPage(0) });
	}, [fetchPage]);

	useWorkbenchControl(id, ModelChatHistoryRefreshControl);

	const { setScroll } = useInfiniteScroll({
		disabled: isLoading || isLoadingMore || !hasMore,
		onNext: () => void fetchPage(rooms.length),
	});

	const stopEditing = () => {
		setEditingRoomId(null);
		setDraftRoomName("");
	};

	const handleRename = async (roomId: string) => {
		const trimmed = draftRoomName.trim();
		if (!trimmed) {
			toast.error("Conversation name cannot be empty.");
			return;
		}

		setIsRenaming(true);
		try {
			await renameRoom(roomId, trimmed);
			// The list is ordered by date, so a rename never moves a row.
			setRooms((current) =>
				current.map((room) =>
					room.roomId === roomId
						? { ...room, roomName: trimmed }
						: room,
				),
			);
			stopEditing();
		} catch (error) {
			console.error("Failed to rename conversation:", error);
			toast.error("Could not rename conversation.");
		} finally {
			setIsRenaming(false);
		}
	};

	const handleDelete = async (roomId: string) => {
		setConfirmingRoomId(null);
		// Dropped locally rather than refetching: a reload would reset the
		// user's scroll position through every page they had loaded.
		setRooms((current) => current.filter((room) => room.roomId !== roomId));
		try {
			await deleteConversation(roomId);
		} catch (error) {
			console.error("Failed to delete conversation:", error);
			toast.error("Could not delete conversation.");
			void fetchPage(0);
		}
	};

	return (
		<div
			className="flex min-h-0 flex-1 flex-col gap-3 p-3"
			data-testid="model-chat-conversations"
		>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-full justify-start gap-2"
				onClick={() => {
					stopEditing();
					void newRoom();
				}}
			>
				<PlusIcon className="size-3.5" aria-hidden />
				New conversation
			</Button>

			<div className="flex items-center gap-2">
				<InputGroup className="min-w-0 flex-1">
					<InputGroupAddon>
						<SearchIcon aria-hidden />
					</InputGroupAddon>
					<InputGroupInput
						value={search}
						placeholder="Search conversations"
						aria-label="Search conversations"
						onChange={(event) => setSearch(event.target.value)}
						data-testid="model-chat-conversations-search"
					/>
				</InputGroup>

				<DropdownMenu>
					<Tooltip>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									className="shrink-0 text-muted-foreground"
									aria-label={`Sort conversations: ${activeSortLabel}`}
									data-testid="model-chat-conversations-sort"
								>
									<ArrowUpDownIcon aria-hidden />
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>Sort: {activeSortLabel}</TooltipContent>
					</Tooltip>
					<DropdownMenuContent align="end">
						<DropdownMenuRadioGroup
							value={sort}
							onValueChange={(next) =>
								setSort(next as ConversationSort)
							}
						>
							{SORT_OPTIONS.map((option) => (
								<DropdownMenuRadioItem
									key={option.value}
									value={option.value}
								>
									{option.label}
								</DropdownMenuRadioItem>
							))}
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/*
			 * A plain scroller rather than ScrollArea: useInfiniteScroll listens
			 * on the element it is handed, and ScrollArea scrolls an inner
			 * viewport that this ref would not reach.
			 */}
			<div
				ref={setScroll}
				className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border"
				data-testid="model-chat-conversations-list"
			>
				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Spinner />
					</div>
				) : rooms.length === 0 ? (
					<p className="px-4 py-6 text-center text-muted-foreground text-sm">
						{search
							? "No conversations match that search."
							: "No previous conversations with this model yet."}
					</p>
				) : (
					<>
						{rooms.map((room) => {
							const isActive = room.roomId === activeRoomId;
							const isEditing = editingRoomId === room.roomId;
							const isConfirming =
								confirmingRoomId === room.roomId;

							return (
								<div
									key={room.roomId}
									className={cn(
										"group flex w-full items-start gap-2 border-border border-b px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-accent/50",
										isActive && "bg-accent",
									)}
								>
									{isEditing ? (
										<Input
											value={draftRoomName}
											onChange={(event) =>
												setDraftRoomName(
													event.target.value,
												)
											}
											onKeyDown={(
												event: KeyboardEvent<HTMLInputElement>,
											) => {
												if (event.key === "Enter") {
													event.preventDefault();
													void handleRename(
														room.roomId,
													);
												}
												if (event.key === "Escape") {
													event.preventDefault();
													stopEditing();
												}
											}}
											autoFocus
											aria-label="Conversation name"
											className="h-8"
											disabled={isRenaming}
										/>
									) : isConfirming ? (
										<span className="min-w-0 flex-1 py-1 text-muted-foreground">
											Delete this conversation?
										</span>
									) : (
										<button
											type="button"
											onClick={() => {
												stopEditing();
												void resumeRoom(
													room.roomId,
													room.roomName,
												);
											}}
											className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left"
										>
											<span className="line-clamp-2 w-full font-medium leading-snug">
												{room.roomName ||
													"New conversation"}
											</span>
											<span className="text-muted-foreground text-xs">
												{formatSessionDate(
													room.dateCreated,
												)}
											</span>
										</button>
									)}

									{isEditing ? (
										<div className="flex items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Save conversation name"
												onClick={() =>
													void handleRename(
														room.roomId,
													)
												}
												disabled={isRenaming}
											>
												<CheckIcon aria-hidden />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Cancel rename"
												onClick={stopEditing}
												disabled={isRenaming}
											>
												<XIcon aria-hidden />
											</Button>
										</div>
									) : isConfirming ? (
										<div className="flex items-center gap-1">
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Confirm delete"
												className="text-destructive"
												onClick={() =>
													void handleDelete(
														room.roomId,
													)
												}
											>
												<CheckIcon aria-hidden />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Cancel delete"
												onClick={() =>
													setConfirmingRoomId(null)
												}
											>
												<XIcon aria-hidden />
											</Button>
										</div>
									) : (
										<div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Rename conversation"
												onClick={() => {
													setConfirmingRoomId(null);
													setEditingRoomId(
														room.roomId,
													);
													setDraftRoomName(
														room.roomName,
													);
												}}
											>
												<PencilIcon aria-hidden />
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="icon-sm"
												aria-label="Delete conversation"
												onClick={() => {
													stopEditing();
													setConfirmingRoomId(
														room.roomId,
													);
												}}
											>
												<Trash2Icon aria-hidden />
											</Button>
										</div>
									)}
								</div>
							);
						})}

						{isLoadingMore && (
							<div className="flex items-center justify-center py-3">
								<Spinner className="size-4" />
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

/**
 * Blueprint for the conversation history border panel. keepAlive: the loaded
 * pages, scroll position, search, and sort survive toggling the border.
 *
 * @name MODEL_CHAT_HISTORY_PANEL
 */
export const MODEL_CHAT_HISTORY_PANEL: WorkbenchPanelConfig<
	Record<string, unknown>,
	ModelChatHistoryApi
> = {
	name: "History",
	helpText: "Conversation history",
	icon: ({ className }) => <HistoryIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ModelChatConversations,
};
