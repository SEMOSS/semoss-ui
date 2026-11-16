import { CalendarClock, House, Layers, Tags, UsersRound } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { ChatHistoryList } from "@/features/dashboard/chat-history-list";
import { selectToday } from "@/features/dashboard/today-selectors";
import { RoutineRecentRuns } from "@/features/routines/routine-recent-runs";
import { lexicon } from "@/lib/lexicon";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	CollaborationNavigationHeader,
	type NavigationToggle,
} from "./collaboration-navigation-header";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";
import { CollaborationSettingsLink } from "./collaboration-settings-link";

interface CollaborationNavigationProps {
	/** Renders a compact icon rail on desktop. */
	isCollapsed?: boolean;
	/** Controls the saved session disclosure when rendered by the shell. */
	isSessionsOpen?: boolean;
	/** Saves the user's session disclosure preference. */
	onSessionsOpenChange?: (isOpen: boolean) => void;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
	/** The desktop collapse button, shown in the header. */
	toggle?: NavigationToggle;
}

/** One quiet navigation follows the daily brief, the work and its topics, and conversations. */
export function CollaborationNavigation({
	isCollapsed = false,
	isSessionsOpen,
	onSessionsOpenChange,
	onNavigate,
	toggle,
}: CollaborationNavigationProps) {
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	// filing and setup stay reachable from Settings and search; Topics sits under Work because the owner
	// opens it often, and Routines stays here because it is the proactive part
	const links = [
		{
			to: "/",
			label: lexicon.today,
			icon: House,
			// only what is due today, so the badge stays meaningful
			count: selectToday(state).due,
			isActive: pathname === "/",
		},
		{
			to: "/work",
			label: "Work",
			icon: Layers,
			count: 0,
			// its topic index has a link of its own
			isActive:
				pathname.startsWith("/work") &&
				!pathname.startsWith("/work/topics"),
		},
		{
			to: "/work/topics",
			label: "Topics",
			icon: Tags,
			count: 0,
			// the index and each topic's own page
			isActive:
				pathname.startsWith("/work/topics") ||
				pathname.startsWith("/topics/"),
		},
		{
			to: "/twins",
			label: "Digital Twins",
			icon: UsersRound,
			count: 0,
			isActive: pathname.startsWith("/twins"),
		},
		// last: its recent runs lead the scroller below and read as its own only right under it
		{
			to: "/routines",
			label: "Routines",
			icon: CalendarClock,
			count: 0,
			isActive: pathname === "/routines",
		},
	];
	const renderLink = ({
		to,
		label,
		icon: Icon,
		count,
		isActive,
	}: (typeof links)[number]) => (
		// a fresh tooltip per rail state: hovered while expanded (no label drawn) it never closes, so collapsing would
		// show every label hovered before
		<Tooltip key={`${to}:${isCollapsed}`} disableHoverableContent={false}>
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
							<span className="truncate">{label}</span>
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
					{count > 0 ? ` \u00b7 ${count}` : ""}
				</TooltipContent>
			)}
		</Tooltip>
	);
	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="shrink-0 p-2 pr-3 pb-0">
				<CollaborationNavigationHeader
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
					toggle={toggle}
				/>
			</div>
			<nav
				aria-label="Main"
				className="flex shrink-0 flex-col gap-0.5 px-2 pt-2 pr-3 pb-0.5"
			>
				{links.map(renderLink)}
			</nav>
			<div className="flex min-h-0 flex-1 flex-col pr-1">
				<div
					className={cn(
						"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-1.5",
						isCollapsed && "hidden",
					)}
				>
					{/* under Routines, the last link, but scrolling with Chats so a long list never pushes Settings off screen */}
					<RoutineRecentRuns onNavigate={onNavigate} />
					<ChatHistoryList
						isOpen={isSessionsOpen}
						onOpenChange={onSessionsOpenChange}
						onNavigate={onNavigate}
					/>
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-start gap-1 border-sidebar-border border-t p-2 pr-3">
				<CollaborationSettingsLink
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
				<CollaborationProfileMenu onNavigate={onNavigate} />
			</div>
		</div>
	);
}
