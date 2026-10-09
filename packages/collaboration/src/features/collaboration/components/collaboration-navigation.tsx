import { Brain, Folder } from "lucide-react";
import { Link, useLocation } from "react-router";
import { cn, Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import { CollaborationNavigationHeader } from "./collaboration-navigation-header";
import { CollaborationProfileMenu } from "./collaboration-profile-menu";
import { CollaborationTopicsNavigation } from "./collaboration-topics-navigation";

interface CollaborationNavigationProps {
	/** Renders a compact icon rail on desktop. */
	isCollapsed?: boolean;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
}

/** Topics organize work above the owner's pinned conversations. */
export function CollaborationNavigation({
	isCollapsed = false,
	onNavigate,
}: CollaborationNavigationProps) {
	const { pathname } = useLocation();
	const links = [
		{
			to: "/tasks/topics",
			label: "My topics",
			icon: Folder,
			isActive: ["/tasks/topics", "/work/topics"].includes(
				pathname.replace(/\/$/, ""),
			),
		},
		{
			to: "/brain",
			label: "Brain",
			icon: Brain,
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
				{links.map(({ to, label, icon: Icon, isActive }) => (
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
									<span className="truncate">{label}</span>
								)}
							</Link>
						</TooltipTrigger>
						{isCollapsed && (
							<TooltipContent side="right">
								{label}
							</TooltipContent>
						)}
					</Tooltip>
				))}
			</nav>
			<div className="flex min-h-0 flex-1 flex-col pr-1">
				<CollaborationTopicsNavigation
					isHidden={isCollapsed}
					onNavigate={onNavigate}
				/>
			</div>
			<div className="shrink-0 border-sidebar-border border-t p-2 pr-3">
				<CollaborationProfileMenu
					isCollapsed={isCollapsed}
					onNavigate={onNavigate}
				/>
			</div>
		</div>
	);
}
