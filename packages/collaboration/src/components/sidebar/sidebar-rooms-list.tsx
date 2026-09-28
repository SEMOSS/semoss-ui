import { Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	Muted,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useSidebar,
} from "@semoss/ui/next";
import { parseTimestamp } from "@semoss/utility";
import { DeleteRoomDialog } from "@/features/rooms/components/delete-room-dialog";
import { RenameRoomDialog } from "@/features/rooms/components/rename-room-dialog";
import type { Session } from "@/types/session";
import { SidebarRoomActions } from "./sidebar-room-actions";
import { SidebarRoomLink } from "./sidebar-room-link";
import { SidebarSearchPalette } from "./sidebar-search-palette";

const ROOM_PAGE_SIZE = 20;

interface SidebarRoomsListProps {
	sessions: Session[];
	activeRoomId?: string;
	isLoading?: boolean;
	onRoomPin: (roomId: string, pinned: boolean) => void;
	onRoomRename: (roomId: string, name: string) => Promise<void>;
	onRoomDelete: (roomId: string) => Promise<void>;
	onRoomVisited: (roomId: string) => void;
}

function compareRoomsNewestFirst(left: Session, right: Session): number {
	return (
		(parseTimestamp(right.updatedAt) ?? 0) -
		(parseTimestamp(left.updatedAt) ?? 0)
	);
}

/** Playground-style pinned and recent room history for the workspace sidebar. */
export function SidebarRoomsList({
	sessions,
	activeRoomId,
	isLoading = false,
	onRoomPin,
	onRoomRename,
	onRoomDelete,
	onRoomVisited,
}: SidebarRoomsListProps) {
	const { isMobile, setOpenMobile, state } = useSidebar();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const searchTriggerRef = useRef<HTMLButtonElement>(null);
	const shouldRestoreSearchFocus = useRef(false);
	const [visibleRoomCount, setVisibleRoomCount] = useState(ROOM_PAGE_SIZE);
	const [renameTarget, setRenameTarget] = useState<Session | null>(null);
	const [isRenameOpen, setIsRenameOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const dialogReturnFocusRef = useRef<HTMLButtonElement | null>(null);
	const shouldCloseMobileAfterDeleteRef = useRef(false);

	const sortedSessions = useMemo(
		() => [...sessions].sort(compareRoomsNewestFirst),
		[sessions],
	);
	const pinnedRooms = sortedSessions.filter((room) => room.pinned);
	const unpinnedRooms = sortedSessions.filter((room) => !room.pinned);
	const activeRoomIndex = activeRoomId
		? unpinnedRooms.findIndex((room) => room.id === activeRoomId)
		: -1;
	const activeRoomCount =
		activeRoomIndex >= 0
			? Math.ceil((activeRoomIndex + 1) / ROOM_PAGE_SIZE) * ROOM_PAGE_SIZE
			: 0;
	const effectiveVisibleRoomCount = Math.max(
		visibleRoomCount,
		activeRoomCount,
	);
	const visibleRooms = unpinnedRooms.slice(0, effectiveVisibleRoomCount);
	const hasMoreRooms = visibleRooms.length < unpinnedRooms.length;
	const canShowFewerRooms = visibleRoomCount > ROOM_PAGE_SIZE;

	useEffect(() => {
		if (isSearchOpen || !shouldRestoreSearchFocus.current) return;
		let cancelled = false;
		queueMicrotask(() => {
			if (cancelled) return;
			searchTriggerRef.current?.focus();
			shouldRestoreSearchFocus.current = false;
		});
		return () => {
			cancelled = true;
		};
	}, [isSearchOpen]);

	function openSearch(): void {
		shouldRestoreSearchFocus.current = true;
		setIsSearchOpen(true);
	}

	function visitRoom(roomId: string): void {
		onRoomVisited(roomId);
		if (isMobile) setOpenMobile(false);
	}

	function requestRoomRename(
		room: Session,
		trigger: HTMLButtonElement | null,
	): void {
		dialogReturnFocusRef.current = trigger;
		setRenameTarget(room);
		setIsRenameOpen(true);
	}

	function requestRoomDelete(
		room: Session,
		trigger: HTMLButtonElement | null,
	): void {
		dialogReturnFocusRef.current = trigger;
		setDeleteTarget(room);
		setIsDeleteOpen(true);
	}

	function isRoomDialogTarget(roomId: string): boolean {
		return renameTarget?.id === roomId || deleteTarget?.id === roomId;
	}

	async function handleRoomDelete(roomId: string): Promise<void> {
		const shouldCloseMobile = isMobile && activeRoomId === roomId;
		await onRoomDelete(roomId);
		shouldCloseMobileAfterDeleteRef.current = shouldCloseMobile;
	}

	function handleDeleteDialogClosed(): void {
		setDeleteTarget(null);
		if (!shouldCloseMobileAfterDeleteRef.current) return;
		shouldCloseMobileAfterDeleteRef.current = false;
		setOpenMobile(false);
	}

	function handleResizeRooms(): void {
		setVisibleRoomCount((current) =>
			hasMoreRooms ? current + ROOM_PAGE_SIZE : ROOM_PAGE_SIZE,
		);
	}

	function roomList(rooms: Session[], label: string): ReactNode {
		return (
			<ul className="space-y-0.5" aria-label={label}>
				{rooms.map((room) => (
					<SidebarRoomLink
						key={room.id}
						room={room}
						active={room.id === activeRoomId}
						trailingAction={
							<SidebarRoomActions
								room={room}
								forceVisible={isRoomDialogTarget(room.id)}
								className="me-1"
								onPin={onRoomPin}
								onRename={requestRoomRename}
								onDelete={requestRoomDelete}
							/>
						}
						onVisit={visitRoom}
					/>
				))}
			</ul>
		);
	}

	function searchAction(): ReactNode {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<SidebarGroupAction
						ref={searchTriggerRef}
						type="button"
						className="end-2 top-3 size-6 transition-opacity group-focus-within/rooms:opacity-100 group-hover/rooms:opacity-100 [@media(hover:hover)]:opacity-0"
						aria-label="Search routes and rooms"
						onClick={openSearch}
					>
						<Search aria-hidden="true" />
					</SidebarGroupAction>
				</TooltipTrigger>
				<TooltipContent>Search routes and rooms</TooltipContent>
			</Tooltip>
		);
	}

	return (
		<>
			{state === "collapsed" && !isMobile ? (
				<div
					data-slot="collapsed-room-navigation"
					className="flex w-full justify-center py-1"
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								ref={searchTriggerRef}
								type="button"
								variant="ghost"
								size="icon-lg"
								aria-label="Search routes and rooms"
								onClick={openSearch}
							>
								<Search aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">
							Search routes and rooms
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<div data-slot="room-navigation" className="w-full">
					{isLoading && sessions.length === 0 ? (
						<SidebarGroup className="group/rooms px-0 py-2">
							<SidebarGroupLabel className="px-2">
								Rooms
							</SidebarGroupLabel>
							{searchAction()}
							<SidebarGroupContent>
								<div className="flex items-center gap-2 px-2 py-2 text-muted-foreground text-xs">
									<Spinner
										aria-label="Loading rooms"
										className="size-3.5"
									/>
									<Muted className="text-xs">
										Loading rooms
									</Muted>
								</div>
							</SidebarGroupContent>
						</SidebarGroup>
					) : sessions.length === 0 ? (
						<SidebarGroup className="group/rooms px-0 py-2">
							<SidebarGroupLabel className="px-2">
								Rooms
							</SidebarGroupLabel>
							{searchAction()}
							<SidebarGroupContent>
								<Muted className="block px-2 py-2 text-xs">
									No rooms yet
								</Muted>
							</SidebarGroupContent>
						</SidebarGroup>
					) : (
						<>
							{pinnedRooms.length > 0 && (
								<SidebarGroup className="group/rooms px-0 py-2">
									<SidebarGroupLabel className="px-2">
										Pinned
									</SidebarGroupLabel>
									{searchAction()}
									<SidebarGroupContent>
										{roomList(pinnedRooms, "Pinned rooms")}
									</SidebarGroupContent>
								</SidebarGroup>
							)}
							{unpinnedRooms.length > 0 && (
								<SidebarGroup
									className={
										pinnedRooms.length > 0
											? "px-0 py-1"
											: "group/rooms px-0 py-2"
									}
								>
									<SidebarGroupLabel className="px-2">
										Rooms
									</SidebarGroupLabel>
									{pinnedRooms.length === 0 && searchAction()}
									<SidebarGroupContent>
										{roomList(visibleRooms, "Rooms")}
										{(hasMoreRooms ||
											canShowFewerRooms) && (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="mt-1 w-full justify-start px-2"
												onClick={handleResizeRooms}
											>
												{hasMoreRooms
													? "Load more rooms"
													: "Show fewer rooms"}
											</Button>
										)}
									</SidebarGroupContent>
								</SidebarGroup>
							)}
						</>
					)}
				</div>
			)}
			<SidebarSearchPalette
				open={isSearchOpen}
				onClose={() => setIsSearchOpen(false)}
			/>
			<RenameRoomDialog
				open={isRenameOpen}
				room={renameTarget}
				returnFocusRef={dialogReturnFocusRef}
				fallbackFocusRef={searchTriggerRef}
				onOpenChange={setIsRenameOpen}
				onAfterClose={() => setRenameTarget(null)}
				onRename={onRoomRename}
			/>
			<DeleteRoomDialog
				open={isDeleteOpen}
				room={deleteTarget}
				returnFocusRef={dialogReturnFocusRef}
				fallbackFocusRef={searchTriggerRef}
				onOpenChange={setIsDeleteOpen}
				onAfterClose={handleDeleteDialogClosed}
				onDelete={handleRoomDelete}
			/>
		</>
	);
}
