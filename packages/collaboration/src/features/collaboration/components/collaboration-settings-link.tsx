import { Settings2 } from "lucide-react";
import { NavLink } from "react-router";
import {
	Button,
	cn,
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
					className={cn(
						"min-h-8 pointer-coarse:min-h-11 w-full justify-start gap-2 px-2 font-normal text-xs has-[>svg]:px-2",
						isCollapsed && "justify-center px-0 has-[>svg]:px-0",
					)}
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
			{isCollapsed && (
				<TooltipContent side="right">Settings</TooltipContent>
			)}
		</Tooltip>
	);
}
