import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router";
import {
	Button,
	cn,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRoomTree } from "@/features/room-tree/room-tree.context";
import { RoomTreeRoomLink } from "@/features/room-tree/room-tree-room-link";
import { CreateTopicDialog } from "@/features/topics/create-topic-dialog";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { topicTone } from "../topic-tone";

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
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const [isCreating, setIsCreating] = useState(false);
	const createButtonRef = useRef<HTMLButtonElement>(null);
	const topics = state.topics
		.filter(
			(topic) => topic.status === "active" || topic.status === "dormant",
		)
		.sort(
			(left, right) =>
				left.name.localeCompare(right.name, undefined, {
					sensitivity: "base",
				}) || left.id.localeCompare(right.id),
		);
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
			<nav aria-label="Topics" className="pb-4">
				<div className="flex min-h-11 items-center justify-between gap-2 px-2">
					<Small className="font-medium text-muted-foreground text-xs">
						Topics
					</Small>
					<Tooltip disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="pointer-coarse:min-h-11 pointer-coarse:min-w-11"
								aria-label="New topic"
								onClick={(event) => {
									createButtonRef.current =
										event.currentTarget;
									setIsCreating(true);
								}}
							>
								<Plus aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Create a topic</TooltipContent>
					</Tooltip>
				</div>
				<ul className="space-y-0.5">
					{topics.map((topic) => {
						const path = `/tasks/topic/${encodeURIComponent(topic.id)}`;
						const isActive = [
							path,
							`/work/topic/${encodeURIComponent(topic.id)}`,
						].includes(pathname.replace(/\/$/, ""));
						return (
							<li key={topic.id}>
								<Link
									to={path}
									aria-current={isActive ? "page" : undefined}
									onClick={onNavigate}
									className="flex min-h-9 pointer-coarse:min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium"
								>
									<span
										aria-hidden="true"
										className={cn(
											"size-2 shrink-0 rounded-full",
											topicTone(topic.id),
										)}
									/>
									<span className="min-w-0 break-words">
										{topic.name}
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
				{topics.length === 0 && (
					<div className="space-y-2 px-2 py-2">
						<Small className="block font-normal text-muted-foreground text-xs leading-5">
							Create a topic to bring related work together.
						</Small>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="pointer-coarse:min-h-11"
							onClick={(event) => {
								createButtonRef.current = event.currentTarget;
								setIsCreating(true);
							}}
						>
							<Plus aria-hidden="true" />
							Create your first topic
						</Button>
					</div>
				)}
			</nav>
			<nav
				aria-label="Pinned rooms"
				className="border-sidebar-border border-t pt-4"
			>
				<Small className="block px-2 pb-2 font-medium text-muted-foreground text-xs">
					Pinned rooms
				</Small>
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
					Pin a room from its chat header or the Rooms tab to keep it
					here.
				</Small>
			)}
			{isCreating && (
				<CreateTopicDialog
					returnFocusRef={createButtonRef}
					onSubmit={(id) => {
						setIsCreating(false);
						if (id) {
							void navigate(
								`/tasks/topic/${encodeURIComponent(id)}`,
							);
							onNavigate?.();
						}
					}}
				/>
			)}
		</div>
	);
}
