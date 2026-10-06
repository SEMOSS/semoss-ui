import { Settings2 } from "lucide-react";
import { NavLink } from "react-router";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface CollaborationSettingsLinkProps {
	/** Compact navigation shows only the settings icon. */
	isCollapsed: boolean;
	/** Closes the mobile navigation after selecting a destination. */
	onNavigate?: () => void;
}

/** One entry point for personal preferences and workspace configuration. */
export function CollaborationSettingsLink({
	isCollapsed,
	onNavigate,
}: CollaborationSettingsLinkProps) {
	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					asChild
					variant="ghost"
					size={isCollapsed ? "icon-sm" : "sm"}
					className="ml-auto pointer-coarse:min-h-11 pointer-coarse:min-w-11"
				>
					<NavLink
						to="/settings"
						onClick={onNavigate}
						aria-label="Settings"
						className="text-muted-foreground aria-[current=page]:bg-sidebar-accent aria-[current=page]:text-sidebar-accent-foreground"
					>
						<Settings2 aria-hidden="true" />
						{!isCollapsed && "Settings"}
					</NavLink>
				</Button>
			</TooltipTrigger>
			{isCollapsed && <TooltipContent>Settings</TooltipContent>}
		</Tooltip>
	);
}
