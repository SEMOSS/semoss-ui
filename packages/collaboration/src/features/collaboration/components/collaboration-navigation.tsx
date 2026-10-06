import { Brain, Inbox, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ChatHistoryList } from "@/features/dashboard/chat-history-list";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationNavigationHeader } from "./collaboration-navigation-header";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";
import { CollaborationTopicsNavigation } from "./collaboration-topics-navigation";

interface CollaborationNavigationProps {
	/** Renders a compact icon rail on desktop. */
	isCollapsed?: boolean;
	/** Toggles the desktop navigation width. */
	onCollapse?: () => void;
	/** Controls the saved topic disclosure when rendered by the shell. */
	isTopicsOpen?: boolean;
	/** Saves the user's topic disclosure preference. */
	onTopicsOpenChange?: (isOpen: boolean) => void;
	/** Opens the shell-owned topic editor independently of mobile navigation. */
	onNewTopic?: (trigger: HTMLButtonElement) => void;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
}

/** One quiet navigation follows the daily brief, topics, and conversations. */
export function CollaborationNavigation({
	isCollapsed = false,
	onCollapse,
	isTopicsOpen,
	onTopicsOpenChange,
	onNewTopic,
	onNavigate,
}: CollaborationNavigationProps) {
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	const [isLocalTopicsOpen, setIsLocalTopicsOpen] = useState(false);
	const { setIsSearchOpen, searchReturnFocus } = useDashboard();
	const reviews =
		state.reviews.filter((review) => review.status === "open").length +
		state.topics.reduce(
			(count, topic) =>
				count +
				topic.notes.filter((note) => note.status === "draft").length,
			0,
		);
	const links = [
		{
			to: "/",
			label: "For you",
			icon: Inbox,
			count: selectWorkItems(state, { view: "needs_me" }).total,
			isActive:
				["/", "/work", "/work/waiting", "/work/done"].includes(
					pathname,
				) || pathname.startsWith("/work/topic/"),
		},
		{
			to: "/brain",
			label: "Brain",
			icon: Brain,
			count: reviews,
			isActive: pathname === "/brain" || pathname.startsWith("/brain/"),
		},
	];
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className={cn("shrink-0 p-3 pb-0", isCollapsed && "px-2")}>
				<CollaborationNavigationHeader
					isCollapsed={isCollapsed}
					onCollapse={onCollapse}
				/>
			</div>
			<nav
				aria-label="Main"
				className={cn(
					"shrink-0 space-y-1 px-3 pt-2 pb-4",
					isCollapsed && "px-2",
				)}
			>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							asChild
							variant="secondary"
							className={cn(
								"h-10 pointer-coarse:min-h-11 w-full justify-start gap-3 rounded-lg border border-primary/20 bg-primary/10 px-3 font-medium text-foreground hover:bg-primary/15 dark:border-primary/40 dark:bg-primary/25 dark:hover:bg-primary/35",
								isCollapsed && "justify-center px-0",
							)}
						>
							<NavLink
								to="/new"
								onClick={onNavigate}
								aria-label="New Task"
							>
								<Plus
									aria-hidden="true"
									className="text-primary dark:text-foreground"
								/>
								{!isCollapsed && "New Task"}
							</NavLink>
						</Button>
					</TooltipTrigger>
					{isCollapsed && (
						<TooltipContent side="right">New Task</TooltipContent>
					)}
				</Tooltip>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							className={cn(
								"mb-3 h-10 pointer-coarse:min-h-11 w-full justify-start gap-3 rounded-lg px-3 font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
								isCollapsed && "justify-center px-0",
							)}
							aria-label="Search your workspace"
							onClick={(event) => {
								searchReturnFocus.current = event.currentTarget;
								onNavigate?.();
								setIsSearchOpen(true);
							}}
						>
							<Search aria-hidden="true" />
							{!isCollapsed && (
								<>
									<span>Search</span>
									<kbd className="ml-auto font-sans text-xs">
										⌘K
									</kbd>
								</>
							)}
						</Button>
					</TooltipTrigger>
					{isCollapsed && (
						<TooltipContent side="right">Search</TooltipContent>
					)}
				</Tooltip>
				{links.map(({ to, label, icon: Icon, count, isActive }) => (
					<Tooltip key={to} disableHoverableContent={false}>
						<TooltipTrigger asChild>
							<Link
								to={to}
								aria-current={isActive ? "page" : undefined}
								onClick={onNavigate}
								aria-label={label}
								className={cn(
									"flex min-h-10 pointer-coarse:min-h-11 items-center gap-3 rounded-lg px-3 font-normal text-sm hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium",
									isCollapsed && "justify-center px-0",
								)}
							>
								<Icon
									className="size-4 shrink-0 text-muted-foreground"
									aria-hidden="true"
								/>
								{!isCollapsed && (
									<>
										<span className="truncate">
											{label}
										</span>
										{count > 0 && (
											<span className="ml-auto shrink-0 font-normal text-muted-foreground text-xs tabular-nums">
												{count}
											</span>
										)}
									</>
								)}
							</Link>
						</TooltipTrigger>
						{isCollapsed && (
							<TooltipContent side="right">
								{label}
								{count > 0 ? ` · ${count}` : ""}
							</TooltipContent>
						)}
					</Tooltip>
				))}
			</nav>
			<div className="flex min-h-0 flex-1 flex-col">
				<div
					className={cn(
						"flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
						isCollapsed && "hidden",
					)}
				>
					<CollaborationTopicsNavigation
						isOpen={isTopicsOpen ?? isLocalTopicsOpen}
						onOpenChange={
							onTopicsOpenChange ?? setIsLocalTopicsOpen
						}
						onNavigate={onNavigate}
						onNewTopic={onNewTopic}
					/>
					<ChatHistoryList onNavigate={onNavigate} />
				</div>
			</div>
			<CollaborationProfileMenu
				isCollapsed={isCollapsed}
				onNavigate={onNavigate}
			/>
		</div>
	);
}
