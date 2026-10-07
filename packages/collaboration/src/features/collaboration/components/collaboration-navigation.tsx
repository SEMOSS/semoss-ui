import { Brain, BriefcaseBusiness, Inbox, Plus } from "lucide-react";
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
import { selectWorkItems } from "../state/collaboration.selectors";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationNavigationHeader } from "./collaboration-navigation-header";
import { CollaborationSettingsLink } from "./collaboration-settings-link";
import { CollaborationTopicsNavigation } from "./collaboration-topics-navigation";

interface CollaborationNavigationProps {
	/** Renders a compact icon rail on desktop. */
	isCollapsed?: boolean;
	/** Controls the saved topic disclosure when rendered by the shell. */
	isTopicsOpen?: boolean;
	/** Saves the user's topic disclosure preference. */
	onTopicsOpenChange?: (isOpen: boolean) => void;
	/** Controls the saved session disclosure when rendered by the shell. */
	isSessionsOpen?: boolean;
	/** Saves the user's session disclosure preference. */
	onSessionsOpenChange?: (isOpen: boolean) => void;
	/** Opens the shell-owned topic editor independently of mobile navigation. */
	onNewTopic?: (trigger: HTMLButtonElement) => void;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
}

/** One quiet navigation follows the daily brief, topics, and conversations. */
export function CollaborationNavigation({
	isCollapsed = false,
	isTopicsOpen,
	onTopicsOpenChange,
	isSessionsOpen,
	onSessionsOpenChange,
	onNewTopic,
	onNavigate,
}: CollaborationNavigationProps) {
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	const [isLocalTopicsOpen, setIsLocalTopicsOpen] = useState(false);
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
			isActive: pathname === "/",
		},
		{
			to: "/work",
			label: "Work",
			icon: BriefcaseBusiness,
			count: 0,
			isActive: pathname === "/work" || pathname.startsWith("/work/"),
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
			<div className="shrink-0 p-2 pr-3 pb-0">
				<CollaborationNavigationHeader
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
			</div>
			<nav
				aria-label="Main"
				className="flex shrink-0 flex-col gap-0.5 px-2 py-2 pr-3"
			>
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							asChild
							variant="secondary"
							size="sm"
							className={cn(
								"h-auto min-h-8 pointer-coarse:min-h-11 w-full justify-start gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 font-medium text-foreground text-xs hover:bg-primary/15 has-[>svg]:px-2 dark:border-primary/40 dark:bg-primary/25 dark:hover:bg-primary/35",
								isCollapsed &&
									"justify-center px-0 has-[>svg]:px-0",
							)}
						>
							<NavLink
								to="/new"
								onClick={onNavigate}
								aria-label="New Session"
							>
								<Plus
									aria-hidden="true"
									className="text-primary dark:text-foreground"
								/>
								{!isCollapsed && "New Session"}
							</NavLink>
						</Button>
					</TooltipTrigger>
					{isCollapsed && (
						<TooltipContent side="right">
							New Session
						</TooltipContent>
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
									"flex min-h-8 pointer-coarse:min-h-11 items-center gap-2 rounded-lg px-2 py-1 font-normal text-xs hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-medium",
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
			<div className="flex min-h-0 flex-1 flex-col pr-1">
				<div
					className={cn(
						"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
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
					<ChatHistoryList
						isOpen={isSessionsOpen}
						onOpenChange={onSessionsOpenChange}
						onNavigate={onNavigate}
					/>
				</div>
			</div>
			<div className="shrink-0 border-sidebar-border border-t p-2 pr-3">
				<CollaborationSettingsLink
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
			</div>
		</div>
	);
}
