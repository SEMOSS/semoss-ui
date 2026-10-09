import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { Button, cn, Small } from "@semoss/ui/next";
import { useRoomTree } from "@/features/room-tree/room-tree.context";
import { RoomTreeRoomLink } from "@/features/room-tree/room-tree-room-link";

interface CollaborationTopicsNavigationProps {
	/** Hides the rooms in the desktop rail without discarding their scroll position. */
	isHidden?: boolean;
	/** Closes mobile navigation when a destination is selected. */
	onNavigate?: () => void;
}

/** One scroll region keeps saved conversations stable across routes. */
export function CollaborationTopicsNavigation({
	isHidden = false,
	onNavigate,
}: CollaborationTopicsNavigationProps) {
	const tree = useRoomTree();
	const scrollRef = useRef<HTMLDivElement>(null);
	const roomListRef = useRef<HTMLUListElement>(null);
	const { scrollTop } = tree;
	useEffect(() => {
		if (!isHidden && scrollRef.current)
			scrollRef.current.scrollTop = scrollTop.current;
	}, [isHidden, scrollTop]);
	return (
		<div
			ref={scrollRef}
			hidden={isHidden}
			onScroll={(event) => {
				if (!isHidden)
					scrollTop.current = event.currentTarget.scrollTop;
			}}
			className={cn(
				"min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3",
				isHidden && "hidden",
			)}
		>
			<nav aria-label="Rooms">
				<ul ref={roomListRef} className="space-y-0.5">
					{tree.rooms.map((room) => (
						<li key={room.roomId}>
							<RoomTreeRoomLink
								room={room}
								onNavigate={onNavigate}
							/>
						</li>
					))}
				</ul>
				{tree.hasMore && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="pointer-coarse:min-h-11 w-full justify-start px-2 font-normal text-muted-foreground text-xs"
						aria-label="Show 25 more rooms"
						disabled={tree.isLoading}
						onClick={(event) => {
							if (event.detail !== 0) {
								tree.loadMore();
								return;
							}
							const firstNewRoomIndex = tree.rooms.length;
							// Local paging must commit before its disappearing button gives up focus.
							flushSync(() => tree.loadMore());
							roomListRef.current?.children
								.item(firstNewRoomIndex)
								?.querySelector<HTMLAnchorElement>("a")
								?.focus();
						}}
					>
						{tree.isLoading ? "Loading…" : "Show 25 more"}
					</Button>
				)}
			</nav>
			{tree.isLoading && tree.rooms.length === 0 && (
				<output className="block p-2 text-muted-foreground text-xs">
					Loading rooms…
				</output>
			)}
			{tree.error && (
				<div role="alert" className="space-y-1 p-2">
					<Small className="block font-normal text-xs">
						{tree.error}
					</Small>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="pointer-coarse:min-h-11 px-2 text-xs"
						disabled={tree.isLoading}
						onClick={() => tree.retry()}
					>
						Retry rooms
					</Button>
				</div>
			)}
			{!tree.isLoading && !tree.error && tree.rooms.length === 0 && (
				<Small className="block p-2 font-normal text-muted-foreground text-xs leading-4">
					Your conversations will appear here after your first
					message.
				</Small>
			)}
		</div>
	);
}
