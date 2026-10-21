import { Settings2 } from "lucide-react";
import { Link, useLocation } from "react-router";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { suggestedMemories } from "../state/memory";

interface CollaborationSettingsLinkProps {
	/** Compact navigation shows only the settings icon. */
	isCollapsed: boolean;
	/** Closes the mobile navigation after selecting a destination. */
	onNavigate?: () => void;
}

/** One entry point for preferences and setup (filing, people, memory, sources). */
export function CollaborationSettingsLink({
	isCollapsed,
	onNavigate,
}: CollaborationSettingsLinkProps) {
	const { state } = useCollaborationSession();
	const { pathname } = useLocation();
	const isActive =
		pathname.startsWith("/settings") || pathname.startsWith("/brain");
	// filing questions wait here quietly instead of on Today
	const count =
		state.reviews.filter((review) => review.status === "open").length +
		suggestedMemories(state.memories).length;
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					asChild
					variant="ghost"
					size={isCollapsed ? "icon-sm" : "sm"}
					className={cn(
						"min-h-8 pointer-coarse:min-h-11 w-full justify-start gap-2 px-2 font-normal text-xs has-[>svg]:px-2",
						isCollapsed && "justify-center px-0 has-[>svg]:px-0",
					)}
				>
					<Link
						to="/settings"
						onClick={onNavigate}
						aria-label="Settings"
						aria-current={isActive ? "page" : undefined}
						className="text-muted-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
					>
						<Settings2 aria-hidden="true" />
						{!isCollapsed && "Settings"}
						{!isCollapsed && count > 0 && (
							<span className="ml-auto text-muted-foreground text-xs tabular-nums">
								{count}
							</span>
						)}
					</Link>
				</Button>
			</TooltipTrigger>
			{isCollapsed && (
				<TooltipContent side="right">Settings</TooltipContent>
			)}
		</Tooltip>
	);
}
