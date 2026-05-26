import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
	ArrowRightIcon,
	CheckIcon,
	MessagesSquareIcon,
	PencilIcon,
	SearchIcon,
	StarIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { useIteratorPixel } from "@semoss/sdk/react";
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
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { useChat, useGlobalBreadcrumbs } from "@/hooks";

dayjs.extend(relativeTime);

interface RoomItem {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
}

/**
 * All-chats page.
 * Lists every chat (across all workspaces) with multi-select + bulk delete.
 */
export const ChatsPage = observer(() => {
	const { t } = useTranslation(["workspace", "common"]);
	const { chat } = useChat();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{
				name: t("workspace:chats.title", { defaultValue: "All chats" }),
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

	const { setScroll } = useInfiniteScroll({
		disabled: getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			getRooms.next();
		},
	});

	const visibleRooms = useMemo(
		() => getRooms.data.filter((r) => !deletedSet.has(r.ROOM_ID)),
		[getRooms.data, deletedSet],
	);

	const hasSelection = selectedIds.size > 0;
	const allSelected =
		visibleRooms.length > 0 &&
		selectedIds.size >= visibleRooms.length &&
		visibleRooms.every((r) => selectedIds.has(r.ROOM_ID));

	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
	const selectAll = useCallback(
		() => setSelectedIds(new Set(visibleRooms.map((r) => r.ROOM_ID))),
		[visibleRooms],
	);

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
	}, [getRooms.reset, chat.keys.roomCounter]);

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

			if (
				e.key === "Escape" &&
				hasSelection &&
				!editingId &&
				!inEditableField
			) {
				clearSelection();
				return;
			}

			if (
				(e.metaKey || e.ctrlKey) &&
				e.key.toLowerCase() === "a" &&
				!inEditableField &&
				visibleRooms.length > 0
			) {
				e.preventDefault();
				selectAll();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [hasSelection, editingId, visibleRooms, clearSelection, selectAll]);

	const toggleSelectOne = (roomId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(roomId)) next.delete(roomId);
			else next.add(roomId);
			return next;
		});
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
					defaultValue: "Deleted {{count}} chats",
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
					defaultValue:
						"Failed to delete {{failed}} of {{total}} chats",
				}),
			);
		}

		setSelectedIds(new Set());
		setConfirmOpen(false);
		setIsDeleting(false);
		getRooms.reset();
	};

	const handleStartRename = (room: RoomItem) => {
		setEditingId(room.ROOM_ID);
		setEditingName(room.ROOM_NAME);
	};

	const handleCancelRename = () => {
		setEditingId(null);
		setEditingName("");
	};

	const handleSaveRename = async () => {
		if (!editingId) return;
		const trimmed = editingName.trim();
		if (!trimmed) {
			toast.error(t("workspace:chat.renameEmpty"));
			return;
		}
		setIsRenaming(true);
		try {
			await chat.renameRoom(editingId, trimmed);
			toast.success(t("workspace:chat.renameSuccess"));
			setEditingId(null);
			setEditingName("");
			getRooms.reset();
		} catch {
			toast.error(t("workspace:chat.renameFailed"));
		} finally {
			setIsRenaming(false);
		}
	};

	return (
		<div
			ref={(el) => {
				if (el) setScroll(el);
			}}
			className="@container h-full w-full overflow-y-auto"
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				{/* Sticky header */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold @md:text-2xl text-foreground text-xl leading-tight">
							{t("workspace:chats.title", {
								defaultValue: "All chats",
							})}
						</div>
						<div className="@md:block hidden text-muted-foreground text-sm">
							{t("workspace:chats.subtitle", {
								defaultValue:
									"Browse, search, and clean up your chats.",
							})}
						</div>
					</div>
				</div>

				{/* Search */}
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("common:buttons.search", {
							defaultValue: "Search",
						})}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

				{/* Body */}
				<div>
					{getRooms.isLoading && getRooms.data.length === 0 ? (
						<div className="flex w-full items-center justify-center py-12">
							<Spinner />
						</div>
					) : visibleRooms.length === 0 ? (
						<div className="flex w-full items-center justify-center py-12">
							<Muted>
								{t("workspace:chat.noChats", {
									defaultValue: "No chats found",
								})}
							</Muted>
						</div>
					) : (
						<div className="flex w-full flex-col gap-2">
							{visibleRooms.map((r) => {
								const isSelected = selectedIds.has(r.ROOM_ID);
								const isEditing = editingId === r.ROOM_ID;
								const dateInput = r.DATE_CREATED.endsWith("Z")
									? r.DATE_CREATED
									: `${r.DATE_CREATED}Z`;
								const d = dayjs(dateInput);
								const relative = d.isValid()
									? d.fromNow()
									: r.DATE_CREATED;
								const absolute = d.isValid()
									? d.format("MMM D, YYYY h:mm A")
									: r.DATE_CREATED;

								if (isEditing) {
									return (
										<div
											key={r.ROOM_ID}
											className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
										>
											<Input
												autoFocus
												value={editingName}
												disabled={isRenaming}
												onChange={(e) =>
													setEditingName(
														e.target.value,
													)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														handleSaveRename();
													} else if (
														e.key === "Escape"
													) {
														handleCancelRename();
													}
												}}
												className="h-8 flex-1"
											/>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														disabled={isRenaming}
														onClick={
															handleSaveRename
														}
														aria-label={t(
															"workspace:chat.renameSave",
														)}
													>
														<CheckIcon className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{t(
														"workspace:chat.renameSave",
													)}
												</TooltipContent>
											</Tooltip>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														disabled={isRenaming}
														onClick={
															handleCancelRename
														}
														aria-label={t(
															"workspace:chat.cancel",
														)}
													>
														<XIcon className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{t("workspace:chat.cancel")}
												</TooltipContent>
											</Tooltip>
										</div>
									);
								}

								return (
									<div
										key={r.ROOM_ID}
										className={cn(
											"group/row relative flex min-w-0 items-center rounded-lg border border-border bg-card transition-colors hover:border-border/80 hover:bg-accent/40",
											isSelected &&
												"border-primary bg-accent/30",
										)}
									>
										{/* Stretched link covers the WHOLE row but z-0,
										    so anything with z-[1] above it intercepts
										    clicks before the link does. */}
										<Link
											to={`/room/${r.ROOM_ID}`}
											aria-label={t(
												"workspace:chat.selectRoom",
											)}
											className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										/>

										{/* Left select zone — wider hit area for the
										    checkbox. Clicking anywhere here toggles
										    selection instead of opening the room.
										    Keyboard users tab to the inner Checkbox
										    directly, so this zone is mouse-only
										    (tabIndex={-1}) but still gets a `button`
										    role so AT announces its purpose. */}
										{/* biome-ignore lint/a11y/useSemanticElements: cannot use a real <button> here — it would wrap the interactive Checkbox component, which is itself a button (Radix renders <button role="checkbox">). Nested buttons are invalid HTML. The role + tabIndex + aria-label + onKeyDown gives equivalent a11y semantics. */}
										<div
											role="button"
											tabIndex={-1}
											aria-label={t(
												"workspace:chats.selectChat",
												{
													name: r.ROOM_NAME,
													defaultValue:
														"Select chat {{name}}",
												},
											)}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												toggleSelectOne(r.ROOM_ID);
											}}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" ||
													e.key === " "
												) {
													e.preventDefault();
													e.stopPropagation();
													toggleSelectOne(r.ROOM_ID);
												}
											}}
											className="relative z-[1] flex shrink-0 cursor-pointer items-center @md:gap-3 gap-2 py-2.5 @md:ps-3 ps-2 @md:pe-2 pe-1"
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() =>
													toggleSelectOne(r.ROOM_ID)
												}
												onClick={(e) =>
													e.stopPropagation()
												}
												aria-label={t(
													"workspace:chats.selectChat",
													{
														name: r.ROOM_NAME,
														defaultValue:
															"Select chat {{name}}",
													},
												)}
												className={cn(
													!hasSelection &&
														"invisible focus-visible:visible group-hover/row:visible",
												)}
											/>
											<div className="@md:flex hidden size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
												<MessagesSquareIcon className="size-4" />
											</div>
										</div>

										{/* Name + date — link covers this area for navigation */}
										<div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 flex-col py-2.5">
											<div className="flex min-w-0 items-center gap-1.5">
												<div
													dir="auto"
													className="truncate font-semibold text-foreground text-sm leading-tight"
													title={r.ROOM_NAME}
												>
													{r.ROOM_NAME}
												</div>
												{r.PINNED ? (
													<StarIcon
														className="size-3.5 shrink-0 fill-yellow-500 text-yellow-500"
														aria-label={t(
															"workspace:chat.pin",
														)}
													/>
												) : null}
											</div>
											<div
												className="text-muted-foreground text-xs leading-tight"
												title={absolute}
											>
												{relative}
											</div>
										</div>

										{/* Right actions: rename (hover-revealed) + arrow */}
										{/* Right actions: rename (hover-revealed) + arrow.
										    Wrapper is `pointer-events-none` so clicks
										    on the arrow (purely visual) fall through
										    to the stretched Link and navigate to the
										    room. The rename Button re-enables events
										    on itself via `pointer-events-auto`. */}
										<div className="pointer-events-none relative z-[1] flex shrink-0 items-center gap-1 @md:pe-3 pe-2">
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon-sm"
														aria-label={t(
															"workspace:chat.rename",
														)}
														className="pointer-events-auto hidden text-muted-foreground hover:text-foreground focus-visible:inline-flex group-hover/row:inline-flex"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															handleStartRename(
																r,
															);
														}}
														data-testid={`chats-page--rename-${r.ROOM_ID}`}
													>
														<PencilIcon className="size-4" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{t("workspace:chat.rename")}
												</TooltipContent>
											</Tooltip>
											<ArrowRightIcon className="rtl:-scale-x-100 size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
										</div>
									</div>
								);
							})}

							{getRooms.isLoading && getRooms.data.length > 0 && (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-4" />
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Floating action bar — appears when ≥1 chat is selected.
			    Fixed to viewport bottom so it follows the user as they
			    scroll the list. Esc and the Cancel button both clear
			    the selection. */}
			{hasSelection && (
				<div className="-translate-x-1/2 fade-in-0 slide-in-from-bottom-4 fixed bottom-6 left-1/2 z-30 animate-in">
					<div className="flex items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
						<span className="px-3 font-medium text-foreground text-sm">
							{t("workspace:chats.selectedCount", {
								count: selectedIds.size,
								defaultValue: "{{count}} selected",
							})}
						</span>
						{!allSelected && (
							<>
								<Separator
									orientation="vertical"
									className="h-6"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={selectAll}
									disabled={isDeleting}
									data-testid="chats-page--select-all-btn"
								>
									{t("workspace:chats.selectAll", {
										defaultValue: "Select all",
									})}
								</Button>
							</>
						)}
						<Separator orientation="vertical" className="h-6" />
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setConfirmOpen(true)}
							disabled={isDeleting}
							className="text-destructive hover:bg-destructive/10 hover:text-destructive"
							data-testid="chats-page--delete-selected-btn"
						>
							<Trash2Icon />
							{t("workspace:chat.delete", {
								defaultValue: "Delete",
							})}
						</Button>
						<Separator orientation="vertical" className="h-6" />
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSelection}
							disabled={isDeleting}
						>
							{t("workspace:chat.cancel", {
								defaultValue: "Cancel",
							})}
						</Button>
					</div>
				</div>
			)}

			{/* Bulk delete confirmation */}
			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("workspace:chats.bulkDeleteConfirmTitle", {
								count: selectedIds.size,
								defaultValue: "Delete {{count}} chats?",
							})}
						</DialogTitle>
						<DialogDescription>
							{t("workspace:chats.bulkDeleteConfirmDescription", {
								count: selectedIds.size,
								defaultValue:
									"This will permanently delete {{count}} chats. This action cannot be undone.",
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
