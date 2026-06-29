import { SearchIcon, StarIcon, Trash2Icon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { CHECKBOX_CLASS, ChatRow, type RoomItem } from "@/components";
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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

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
			`META | GetPlaygroundRooms(${debouncedSearch ? `search = "<encode>${debouncedSearch}</encode>", ` : ""}limit=${limit}, offset=${offset}, sort=["DESC"]);`,
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{ limit: 25 },
		// Re-fetch only on search change — counter-based refreshes are
		// handled by the useEffect below, which calls reset() and
		// preserves current data instead of clearing it first.
		[debouncedSearch],
	);

	// Full set of pinned rooms across every workspace, independent of the
	// paginated list above — so the pinned section shows every pinned chat
	// even before the user scrolls it into view.
	const getPinnedRooms = usePixel<RoomItem[]>(
		`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		{ data: [] },
	);

	const { setScroll } = useInfiniteScroll({
		disabled: getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			getRooms.next();
		},
	});

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

	const visibleRooms = useMemo(
		() => getRooms.data.filter((r) => !deletedSet.has(r.ROOM_ID)),
		[getRooms.data, deletedSet],
	);

	// While searching, drop the dedicated pinned section so results aren't
	// split confusingly — matches still show their star inline.
	const isSearching = debouncedSearch.length > 0;

	const pinnedRooms = useMemo(() => {
		if (isSearching) return [];
		return Array.from(pinnedIds)
			.filter((id) => !deletedSet.has(id))
			.map((id) => roomById.get(id))
			.filter((r): r is RoomItem => Boolean(r))
			.sort(
				(a, b) =>
					normalizeTimestamp(b.DATE_CREATED).valueOf() -
					normalizeTimestamp(a.DATE_CREATED).valueOf(),
			);
	}, [pinnedIds, deletedSet, roomById, isSearching]);

	// Non-pinned rooms grouped into date buckets, matching the sidebar.
	const groups = useMemo(() => {
		const byBucket = new Map<string, RoomItem[]>();
		for (const room of visibleRooms) {
			if (!isSearching && pinnedIds.has(room.ROOM_ID)) continue;
			const d = normalizeTimestamp(room.DATE_CREATED);
			if (!d.isValid()) continue;
			const bucket = getDateBucket(d);
			const rooms = byBucket.get(bucket);
			if (rooms) rooms.push(room);
			else byBucket.set(bucket, [room]);
		}
		return DATE_BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
			(bucket) => ({
				bucket,
				label: t(`sidebar:buckets.${bucket}`),
				rooms: byBucket.get(bucket) ?? [],
			}),
		);
	}, [visibleRooms, pinnedIds, isSearching, t]);

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
		getPinnedRooms.refresh();
	}, [getRooms.reset, getPinnedRooms.refresh, chat.keys.roomCounter]);

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

	const handleConfirmDelete = async () => {
		if (selectedIds.size === 0) return;
		const ids = Array.from(selectedIds);

		setIsDeleting(true);
		// Optimistically hide
		setDeletedSet((prev) => new Set([...prev, ...ids]));

		const results = await Promise.allSettled(
			ids.map((id) => chat.closeRoom(id)),
		);

		const failed = ids.filter((_id, i) => results[i].status === "rejected");

		if (failed.length === 0) {
			toast.success(
				t("workspace:chats.bulkDeleteSuccess", {
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
				t("workspace:chats.bulkDeletePartialFail", {
					failed: failed.length,
					total: ids.length,
				}),
			);
		}

		setSelectedIds(new Set());
		setConfirmOpen(false);
		setIsDeleting(false);
		getRooms.reset();
		getPinnedRooms.refresh();
	};

	const renderRow = (room: RoomItem) => (
		<ChatRow
			key={room.ROOM_ID}
			room={room}
			isSelected={selectedIds.has(room.ROOM_ID)}
			isPinned={pinnedIds.has(room.ROOM_ID)}
			onToggleSelect={() => toggleSelectOne(room.ROOM_ID)}
			onTogglePin={() => handleTogglePin(room.ROOM_ID)}
		/>
	);

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				{/* Sticky header */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold @md:text-2xl text-foreground text-xl leading-tight">
							{t("workspace:chats.title")}
						</div>
						<div className="@md:block hidden text-muted-foreground text-sm">
							{t("workspace:chats.subtitle")}
						</div>
					</div>
				</div>

				{/* Search */}
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("common:buttons.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

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

				{/* Body */}
				<div>
					{getRooms.isLoading && getRooms.data.length === 0 ? (
						<div className="flex w-full items-center justify-center py-12">
							<Spinner />
						</div>
					) : !hasRooms ? (
						<div className="flex w-full items-center justify-center py-12">
							<Muted>{t("workspace:chat.noChats")}</Muted>
						</div>
					) : (
						<div className="flex w-full flex-col gap-6">
							{/* Pinned section */}
							{pinnedRooms.length > 0 && (
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-1.5 px-1 font-medium text-muted-foreground text-xs">
										<StarIcon className="size-3.5 fill-yellow-500 text-yellow-500" />
										{t("workspace:chats.favorites")}
									</div>
									<div className="flex flex-col gap-2">
										{pinnedRooms.map(renderRow)}
									</div>
								</div>
							)}

							{/* Date-grouped sections */}
							{groups.map((g) => (
								<div
									key={g.bucket}
									className="flex flex-col gap-2"
								>
									<div className="px-1 font-medium text-muted-foreground text-xs">
										{g.label}
									</div>
									<div className="flex flex-col gap-2">
										{g.rooms.map(renderRow)}
									</div>
								</div>
							))}

							{getRooms.isLoading && getRooms.data.length > 0 && (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-4" />
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Bulk delete confirmation */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:chats.bulkDeleteConfirmTitle", {
								count: selectedIds.size,
							})}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:chats.bulkDeleteConfirmDescription", {
								count: selectedIds.size,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
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
		</div>
	);
});
