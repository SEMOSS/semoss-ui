import {
	ChevronDownIcon,
	FileIcon,
	FileTextIcon,
	Loader2Icon,
	SearchIcon,
	StarIcon,
	Trash2Icon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CHECKBOX_CLASS, ChatRow, type RoomItem } from "@/components";
import { SYSTEM__PLAYGROUND } from "@/constants";
import { useChat, useGlobalBreadcrumbs } from "@/hooks";
import {
	DATE_BUCKET_ORDER,
	getDateBucket,
	normalizeTimestamp,
} from "@/utility";

/**
 * All-chats page.
 * Lists every chat (across all workspaces) grouped into a favorites
 * section plus date buckets, with multi-select + bulk delete, inline
 * rename, and pin/unpin.
 */
export const ChatsPage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "sidebar"]);
	const { chat } = useChat();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	// Inclusive DATE_CREATED range — both must be set for the backend to
	// apply the filter. Only narrows the paginated list, not the Favorites
	// section, matching how `search` already leaves Favorites untouched.
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const hasDateRange = Boolean(startDate && endDate);
	const [sortField, setSortField] = useState<"created" | "modified">(
		"created",
	);
	const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	// Set when deleting a single chat via its row menu, instead of the bulk
	// selection toolbar — the confirm dialog below adapts its copy to
	// whichever of the two triggered it.
	const [singleDeleteTarget, setSingleDeleteTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
	const [downloadRoomId, setDownloadRoomId] = useState<string | null>(null);
	const [downloadingFormat, setDownloadingFormat] = useState<
		"word" | "pdf" | null
	>(null);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{
				name: t("workspace:chats.title"),
				path: "/chats",
			},
		],
	});

	const getRooms = useIteratorPixel<RoomItem[], RoomItem>(
		(limit, offset) =>
			`META | GetPlaygroundRooms(${debouncedSearch ? `search = "<encode>${debouncedSearch}</encode>", ` : ""}${hasDateRange ? `startDate=["${startDate}"], endDate=["${endDate}"], ` : ""}limit=${limit}, offset=${offset}, sortBy=["${sortField}"], sort=["${sortDir === "newest" ? "DESC" : "ASC"}"]);`,
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{ limit: 25 },
		// Re-fetch on search, date-range, or sort change — counter-based
		// refreshes are handled by the useEffect below, which calls reset()
		// and preserves current data instead of clearing it first.
		[debouncedSearch, startDate, endDate, sortField, sortDir],
	);

	// Full set of pinned rooms across every workspace, independent of the
	// paginated list above — so the pinned section shows every pinned chat
	// even before the user scrolls it into view.
	const getPinnedRooms = usePixel<RoomItem[]>(
		`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		{ data: [] },
	);

	// Content-match rooms from SearchRoomMessages — rooms whose message text
	// matches the keyword but whose name may not.
	const getContentMatches = useIteratorPixel<
		{
			room_id: string;
			message_id: string;
			room_name: string;
			date_created: string;
			match_count: number;
		}[],
		RoomItem
	>(
		(limit, offset) =>
			debouncedSearch
				? `META | SearchRoomMessages(search=[${JSON.stringify(debouncedSearch)}], project=["${SYSTEM__PLAYGROUND}"], ${hasDateRange ? `startDate=["${startDate}"], endDate=["${endDate}"], ` : ""}limit=[${limit}], offset=[${offset}], includeMessageText=[false]);`
				: "",
		// Same short-page-means-last-page heuristic as getRooms above — the
		// backend already groups to one row per room before limit/offset, so a
		// full page here means "there may be more matching rooms."
		(response) => (response.length < 50 ? -1 : Infinity),
		(rows) => {
			const seen = new Set<string>();
			return rows
				.filter(
					(r) => r.room_id && seen.size !== seen.add(r.room_id).size,
				)
				.map((r) => ({
					ROOM_ID: r.room_id,
					ROOM_NAME: r.room_name ?? "",
					DATE_CREATED: r.date_created ?? "",
					MATCH_COUNT: r.match_count,
				}));
		},
		{ limit: 50 },
		[debouncedSearch, startDate, endDate],
	);

	const { setScroll } = useInfiniteScroll({
		disabled:
			(getRooms.isLoading || !getRooms.hasMore) &&
			(getContentMatches.isLoading || !getContentMatches.hasMore),
		onNext: () => {
			if (!getRooms.isLoading && getRooms.hasMore) {
				getRooms.next();
			}
			if (!getContentMatches.isLoading && getContentMatches.hasMore) {
				getContentMatches.next();
			}
		},
	});

	// Debounce hasn't caught up to the latest keystroke yet.
	const isDebouncePending = search !== debouncedSearch;
	const isLoadingRooms =
		isDebouncePending || getRooms.isLoading || getContentMatches.isLoading;

	// Latches true the first time a load settles and never resets, so the
	// list only ever shows the blocking spinner once, on first mount. Every
	// later reload (new search term, roomCounter refresh, pagination) instead
	// dims the current list in place — see the `add-members` modal for the
	// same pattern — instead of clearing it and flashing back to a spinner.
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
	useEffect(() => {
		if (!getRooms.isLoading && !getContentMatches.isLoading) {
			setHasLoadedOnce(true);
		}
	}, [getRooms.isLoading, getContentMatches.isLoading]);

	// Seed pinned ids from the dedicated pinned query. Toggles update
	// `pinnedIds` optimistically and never refetch this query, so this
	// effect won't clobber an in-flight optimistic change.
	useEffect(() => {
		if (getPinnedRooms.status !== "SUCCESS" || !getPinnedRooms.data) return;
		setPinnedIds(new Set(getPinnedRooms.data.map((r) => r.ROOM_ID)));
	}, [getPinnedRooms.status, getPinnedRooms.data]);

	// Lookup of room metadata, preferring the freshest (paginated) data but
	// falling back to the pinned query for pinned rooms not yet paged in.
	const roomById = useMemo(() => {
		const map = new Map<string, RoomItem>();
		for (const r of getPinnedRooms.data ?? []) map.set(r.ROOM_ID, r);
		for (const r of getRooms.data) map.set(r.ROOM_ID, r);
		return map;
	}, [getPinnedRooms.data, getRooms.data]);

	const visibleRooms = useMemo(() => {
		// Not gated on `debouncedSearch`: when the search clears, `getRooms.data`
		// stays stale (by design — see useIteratorPixel) until the no-search
		// fetch resolves, so `getContentMatches.data` must be allowed to stay
		// stale in step with it too. Once both settle, every leftover content
		// match is already covered by `nameMatchIds` and drops out below.
		const nameMatchIds = new Set(getRooms.data.map((r) => r.ROOM_ID));
		const extra = getContentMatches.data.filter(
			(r) => !nameMatchIds.has(r.ROOM_ID) && !deletedSet.has(r.ROOM_ID),
		);
		return [
			...getRooms.data.filter((r) => !deletedSet.has(r.ROOM_ID)),
			...extra,
		].sort(
			(a, b) =>
				normalizeTimestamp(b.DATE_CREATED).valueOf() -
				normalizeTimestamp(a.DATE_CREATED).valueOf(),
		);
	}, [getRooms.data, getContentMatches.data, deletedSet]);

	// While searching, drop the dedicated pinned section so results aren't
	// split confusingly — matches still show their star inline.
	const isSearching = debouncedSearch.length > 0;

	// The timestamp a room is bucketed/sorted by — DATE_CREATED normally, or
	// UPDATED_AT (falling back to DATE_CREATED for rooms with no activity
	// yet) when sorting by last-modified.
	const getSortTimestamp = useCallback(
		(room: RoomItem) =>
			sortField === "modified"
				? room.UPDATED_AT || room.DATE_CREATED
				: room.DATE_CREATED,
		[sortField],
	);

	const compareRooms = useCallback(
		(a: RoomItem, b: RoomItem) => {
			const direction = sortDir === "newest" ? -1 : 1;
			return (
				direction *
				(normalizeTimestamp(getSortTimestamp(a)).valueOf() -
					normalizeTimestamp(getSortTimestamp(b)).valueOf())
			);
		},
		[sortDir, getSortTimestamp],
	);

	const pinnedRooms = useMemo(() => {
		if (isSearching) return [];
		return Array.from(pinnedIds)
			.filter((id) => !deletedSet.has(id))
			.map((id) => roomById.get(id))
			.filter((r): r is RoomItem => Boolean(r))
			.sort(compareRooms);
	}, [pinnedIds, deletedSet, roomById, isSearching, compareRooms]);

	// Non-pinned rooms grouped into date buckets, matching the sidebar. Bucket
	// order (today → older) always stays most-to-least recent regardless of
	// sortDir; only which timestamp it buckets/orders by follows sortField,
	// so switching to "modified" surfaces recently-active rooms under
	// "Today" even if they were created long ago.
	const groups = useMemo(() => {
		const nonPinned = visibleRooms.filter(
			(room) => isSearching || !pinnedIds.has(room.ROOM_ID),
		);

		const byBucket = new Map<string, RoomItem[]>();
		for (const room of nonPinned) {
			const d = normalizeTimestamp(getSortTimestamp(room));
			if (!d.isValid()) continue;
			const bucket = getDateBucket(d);
			const rooms = byBucket.get(bucket);
			if (rooms) rooms.push(room);
			else byBucket.set(bucket, [room]);
		}
		return DATE_BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
			(bucket) => ({
				bucket,
				label: t(`sidebar:buckets.${bucket}`) as string | null,
				rooms: (byBucket.get(bucket) ?? []).slice().sort(compareRooms),
			}),
		);
	}, [
		visibleRooms,
		pinnedIds,
		isSearching,
		t,
		compareRooms,
		getSortTimestamp,
	]);

	const allVisibleIds = useMemo(() => {
		const ids: string[] = [];
		for (const r of pinnedRooms) ids.push(r.ROOM_ID);
		for (const g of groups) for (const r of g.rooms) ids.push(r.ROOM_ID);
		return ids;
	}, [pinnedRooms, groups]);

	const hasRooms = allVisibleIds.length > 0;
	const hasSelection = selectedIds.size > 0;
	const allSelected =
		hasRooms && allVisibleIds.every((id) => selectedIds.has(id));

	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
	const selectAll = useCallback(
		() => setSelectedIds(new Set(allVisibleIds)),
		[allVisibleIds],
	);
	const toggleSelectAll = useCallback(() => {
		if (allSelected) clearSelection();
		else selectAll();
	}, [allSelected, clearSelection, selectAll]);

	// Re-fetch when roomCounter increments (create / rename / delete from
	// anywhere in the app) without clearing the list first. reset()
	// preserves current data while the refetch runs, avoiding a blank flash.
	const didInitialMount = useRef(false);
	useEffect(() => {
		chat.keys.roomCounter;
		if (!didInitialMount.current) {
			didInitialMount.current = true;
			return;
		}
		getRooms.reset();
		getContentMatches.reset();
		getPinnedRooms.refresh();
	}, [
		getRooms.reset,
		getContentMatches.reset,
		getPinnedRooms.refresh,
		chat.keys.roomCounter,
	]);

	// Keyboard shortcuts: Esc clears the current selection;
	// Cmd/Ctrl+A selects all visible chats (only when focus isn't
	// inside a form input so the user can still select text normally).
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;
			const inEditableField =
				!!target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable);

			if (e.key === "Escape" && hasSelection && !inEditableField) {
				clearSelection();
				return;
			}

			if (
				(e.metaKey || e.ctrlKey) &&
				e.key.toLowerCase() === "a" &&
				!inEditableField &&
				hasRooms
			) {
				e.preventDefault();
				selectAll();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [hasSelection, hasRooms, clearSelection, selectAll]);

	const toggleSelectOne = (roomId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(roomId)) next.delete(roomId);
			else next.add(roomId);
			return next;
		});
	};

	const handleTogglePin = async (roomId: string) => {
		const wasPinned = pinnedIds.has(roomId);
		setPinnedIds((prev) => {
			const next = new Set(prev);
			if (wasPinned) next.delete(roomId);
			else next.add(roomId);
			return next;
		});
		try {
			await chat.pinRoom(roomId, !wasPinned);
		} catch {
			setPinnedIds((prev) => {
				const next = new Set(prev);
				if (wasPinned) next.add(roomId);
				else next.delete(roomId);
				return next;
			});
			toast.error(
				wasPinned
					? t("workspace:chat.unpinFailed")
					: t("workspace:chat.pinFailed"),
			);
		}
	};

	const pendingDeleteIds = singleDeleteTarget
		? [singleDeleteTarget.id]
		: Array.from(selectedIds);
	const isDeleteDialogOpen = confirmOpen || singleDeleteTarget !== null;

	const closeDeleteDialog = () => {
		setConfirmOpen(false);
		setSingleDeleteTarget(null);
	};

	const handleConfirmDelete = async () => {
		if (pendingDeleteIds.length === 0) return;
		const ids = pendingDeleteIds;
		const isSingle = singleDeleteTarget !== null;

		setIsDeleting(true);
		// Optimistically hide
		setDeletedSet((prev) => new Set([...prev, ...ids]));

		const results = await Promise.allSettled(
			ids.map((id) => chat.closeRoom(id)),
		);

		const failed = ids.filter((_id, i) => results[i].status === "rejected");

		if (failed.length === 0) {
			toast.success(
				isSingle
					? t("workspace:chat.deleteSuccess")
					: t("workspace:chats.bulkDeleteSuccess", {
							count: ids.length,
						}),
			);
		} else {
			// Restore failed ones from deletedSet
			setDeletedSet((prev) => {
				const next = new Set(prev);
				for (const id of failed) next.delete(id);
				return next;
			});
			toast.error(
				isSingle
					? t("workspace:chat.deleteFailed")
					: t("workspace:chats.bulkDeletePartialFail", {
							failed: failed.length,
							total: ids.length,
						}),
			);
		}

		setSelectedIds(new Set());
		closeDeleteDialog();
		setIsDeleting(false);
		getRooms.reset();
		getPinnedRooms.refresh();
	};

	const handleDownloadConversation = async (
		roomId: string,
		format: "word" | "pdf",
	) => {
		setDownloadingFormat(format);
		try {
			await chat.downloadConversation(roomId, format);
			toast.success(
				t("workspace:chats.downloadSuccess", {
					format: format.toUpperCase(),
				}),
			);
			setDownloadDialogOpen(false);
		} catch (e) {
			toast.error(
				e instanceof Error
					? e.message
					: t("workspace:chats.downloadFailed"),
			);
		} finally {
			setDownloadingFormat(null);
		}
	};

	const renderRow = (room: RoomItem) => (
		<ChatRow
			key={room.ROOM_ID}
			room={room}
			isSelected={selectedIds.has(room.ROOM_ID)}
			isPinned={pinnedIds.has(room.ROOM_ID)}
			onToggleSelect={() => toggleSelectOne(room.ROOM_ID)}
			onTogglePin={() => handleTogglePin(room.ROOM_ID)}
			onDownloadClick={() => {
				setDownloadRoomId(room.ROOM_ID);
				setDownloadDialogOpen(true);
			}}
			onDeleteClick={() =>
				setSingleDeleteTarget({
					id: room.ROOM_ID,
					name: room.ROOM_NAME,
				})
			}
		/>
	);

	return (
		<div className="@container flex h-full w-full flex-col overflow-hidden">
			<div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden @3xl:px-12 @md:px-6 px-4 pt-8">
				{/* Header — title row plus search/sort row. Not scrolling; only
				    the table body below scrolls, matching the knowledge-library
				    page's search/filters-fixed, results-scroll layout. */}
				<div className="flex flex-col gap-3">
					<div className="flex flex-row items-center gap-3">
						<div className="min-w-0 flex-1">
							<div className="truncate font-semibold @md:text-2xl text-foreground text-xl leading-tight">
								{t("workspace:chats.title")}
							</div>
							<div className="@md:block hidden text-muted-foreground text-sm">
								{t("workspace:chats.subtitle")}
							</div>
						</div>
					</div>

					<div className="flex flex-row items-center gap-2">
						<InputGroup className="min-w-0 flex-1 bg-background">
							<InputGroupInput
								placeholder={t("common:buttons.search")}
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
							<InputGroupAddon>
								<SearchIcon />
							</InputGroupAddon>
						</InputGroup>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm">
									{sortField === "created"
										? sortDir === "newest"
											? t(
													"workspace:chats.sortCreatedNewest",
												)
											: t(
													"workspace:chats.sortCreatedOldest",
												)
										: sortDir === "newest"
											? t(
													"workspace:chats.sortModifiedNewest",
												)
											: t(
													"workspace:chats.sortModifiedOldest",
												)}
									<ChevronDownIcon className="ml-1 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-52 p-1" align="start">
								<Button
									variant={
										sortField === "created" &&
										sortDir === "newest"
											? "secondary"
											: "ghost"
									}
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										setSortField("created");
										setSortDir("newest");
									}}
								>
									{t("workspace:chats.sortCreatedNewest")}
								</Button>
								<Button
									variant={
										sortField === "created" &&
										sortDir === "oldest"
											? "secondary"
											: "ghost"
									}
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										setSortField("created");
										setSortDir("oldest");
									}}
								>
									{t("workspace:chats.sortCreatedOldest")}
								</Button>
								<Button
									variant={
										sortField === "modified" &&
										sortDir === "newest"
											? "secondary"
											: "ghost"
									}
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										setSortField("modified");
										setSortDir("newest");
									}}
								>
									{t("workspace:chats.sortModifiedNewest")}
								</Button>
								<Button
									variant={
										sortField === "modified" &&
										sortDir === "oldest"
											? "secondary"
											: "ghost"
									}
									size="sm"
									className="w-full justify-start"
									onClick={() => {
										setSortField("modified");
										setSortDir("oldest");
									}}
								>
									{t("workspace:chats.sortModifiedOldest")}
								</Button>
							</PopoverContent>
						</Popover>
					</div>

					<div className="flex flex-row items-center gap-2">
						<Input
							type="date"
							value={startDate}
							max={endDate || undefined}
							onChange={(e) => setStartDate(e.target.value)}
							className="w-auto"
							aria-label={t("workspace:chats.startDate")}
						/>
						<span className="text-muted-foreground text-sm">
							{t("workspace:chats.dateRangeTo")}
						</span>
						<Input
							type="date"
							value={endDate}
							min={startDate || undefined}
							onChange={(e) => setEndDate(e.target.value)}
							className="w-auto"
							aria-label={t("workspace:chats.endDate")}
						/>
						{hasDateRange && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									setStartDate("");
									setEndDate("");
								}}
							>
								{t("workspace:chats.clearDateRange")}
							</Button>
						)}
					</div>
				</div>

				{/* Select-all toolbar — always visible so the user can select
				    every chat without first selecting one. */}
				{hasRooms && (
					<div className="flex h-8 items-center gap-3 px-1">
						<Checkbox
							checked={allSelected}
							onCheckedChange={toggleSelectAll}
							aria-label={t("workspace:chats.selectAll")}
							className={CHECKBOX_CLASS}
							data-testid="chats-page--select-all-checkbox"
						/>
						<button
							type="button"
							onClick={toggleSelectAll}
							className="font-medium text-foreground text-sm hover:text-foreground/80"
						>
							{allSelected
								? t("workspace:chats.deselectAll")
								: t("workspace:chats.selectAll")}
						</button>
						{hasSelection && (
							<>
								<span className="text-muted-foreground text-sm">
									{t("workspace:chats.selectedCount", {
										count: selectedIds.size,
									})}
								</span>
								<div className="ms-auto flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setConfirmOpen(true)}
										disabled={isDeleting}
										className="text-destructive hover:bg-destructive/10 hover:text-destructive"
										data-testid="chats-page--delete-selected-btn"
									>
										<Trash2Icon />
										{t("workspace:chat.delete")}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={clearSelection}
										disabled={isDeleting}
									>
										{t("workspace:chat.cancel")}
									</Button>
								</div>
							</>
						)}
					</div>
				)}

				{/* Frame — static border/rounding, never scrolls */}
				<div
					className={cn(
						"flex-1 overflow-hidden rounded-lg border transition-opacity",
						isLoadingRooms && hasLoadedOnce && "opacity-60",
					)}
				>
					{/* Body — the only scrollable region on this page */}
					<div
						ref={(el) => {
							if (el) setScroll(el);
						}}
						className="h-full overflow-y-auto pb-4"
					>
						{!hasLoadedOnce && isLoadingRooms ? (
							<div className="flex w-full items-center justify-center py-12">
								<Spinner />
							</div>
						) : !hasRooms ? (
							<div className="flex w-full items-center justify-center py-12">
								<Muted>{t("workspace:chat.noChats")}</Muted>
							</div>
						) : (
							<table className="w-full text-sm">
								<thead className="sticky top-0 z-10">
									<tr className="h-9 border-b bg-muted text-left font-medium text-muted-foreground text-xs">
										<th className="w-10 rounded-tl-lg px-2 py-2 font-medium" />
										<th className="w-full px-4 py-2 font-medium">
											{t("workspace:chats.columnName")}
										</th>
										<th className="hidden px-4 py-2 font-medium sm:table-cell">
											{t(
												"workspace:chats.columnDateCreated",
											)}
										</th>
										<th className="hidden px-4 py-2 font-medium sm:table-cell">
											{t(
												"workspace:chats.columnDateModified",
											)}
										</th>
										<th className="rounded-tr-lg px-4 py-2" />
									</tr>
								</thead>
								<tbody className="divide-y">
									{/* Pinned section */}
									{pinnedRooms.length > 0 && (
										<>
											<tr className="sticky top-9 z-[5]">
												<td
													colSpan={5}
													className="bg-muted px-4 py-1.5"
												>
													<div className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs">
														<StarIcon className="size-3.5 fill-yellow-500 text-yellow-500" />
														{t(
															"workspace:chats.favorites",
														)}
													</div>
												</td>
											</tr>
											{pinnedRooms.map(renderRow)}
										</>
									)}

									{/* Date-grouped sections — a single ungrouped
										    section (no divider) when sorting by name */}
									{groups.map((g) => (
										<Fragment key={g.bucket}>
											{g.label !== null && (
												<tr className="sticky top-9 z-[5]">
													<td
														colSpan={5}
														className="bg-muted px-4 py-1.5 font-medium text-muted-foreground text-xs"
													>
														{g.label}
													</td>
												</tr>
											)}
											{g.rooms.map(renderRow)}
										</Fragment>
									))}

									{hasLoadedOnce && isLoadingRooms && (
										<tr>
											<td colSpan={5}>
												<div className="flex items-center justify-center p-2">
													<Spinner className="size-4" />
												</div>
											</td>
										</tr>
									)}
								</tbody>
							</table>
						)}
					</div>
				</div>
			</div>

			{/* Delete confirmation — bulk (from the selection toolbar) or a
			    single chat (from its row menu) */}
			<Dialog
				open={isDeleteDialogOpen}
				onOpenChange={(open) => {
					if (!open) closeDeleteDialog();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{singleDeleteTarget
								? t("workspace:chat.deleteConfirmTitle")
								: t("workspace:chats.bulkDeleteConfirmTitle", {
										count: selectedIds.size,
									})}
						</DialogTitle>
						<DialogDescription>
							{singleDeleteTarget
								? t("workspace:chat.deleteConfirmDescription", {
										name: singleDeleteTarget.name,
									})
								: t(
										"workspace:chats.bulkDeleteConfirmDescription",
										{ count: selectedIds.size },
									)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeDeleteDialog}
							disabled={isDeleting}
						>
							{t("workspace:chat.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={isDeleting}
							data-testid="chats-page--confirm-delete-btn"
						>
							{t("workspace:chat.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Download conversation — matches the sidebar's dialog */}
			<Dialog
				open={downloadDialogOpen}
				onOpenChange={(open) => {
					setDownloadDialogOpen(open);
					if (!open) setDownloadRoomId(null);
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("workspace:chats.downloadTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:chats.downloadDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="grid grid-cols-2 gap-3 py-4">
						<Button
							variant="outline"
							className="h-auto flex-col gap-1 p-4"
							disabled={downloadingFormat !== null}
							onClick={() => {
								if (downloadRoomId) {
									handleDownloadConversation(
										downloadRoomId,
										"word",
									);
								}
							}}
						>
							{downloadingFormat === "word" ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<>
									<FileTextIcon className="mb-1 size-6" />
									<span className="font-medium">
										Word Document
									</span>
									<span className="text-muted-foreground text-xs">
										.docx
									</span>
								</>
							)}
						</Button>
						<Button
							variant="outline"
							className="h-auto flex-col gap-1 p-4"
							disabled={downloadingFormat !== null}
							onClick={() => {
								if (downloadRoomId) {
									handleDownloadConversation(
										downloadRoomId,
										"pdf",
									);
								}
							}}
						>
							{downloadingFormat === "pdf" ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<>
									<FileIcon className="mb-1 size-6" />
									<span className="font-medium">
										PDF Document
									</span>
									<span className="text-muted-foreground text-xs">
										.pdf
									</span>
								</>
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
});
