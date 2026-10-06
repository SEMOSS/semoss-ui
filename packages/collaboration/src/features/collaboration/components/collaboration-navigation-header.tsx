import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
	Button,
	cn,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface CollaborationNavigationHeaderProps {
	/** Shows the expand control in place of the workspace name. */
	isCollapsed: boolean;
	/** Toggles desktop navigation; omitted inside the mobile drawer. */
	onCollapse?: () => void;
}

/** Workspace identity and its visible desktop navigation toggle. */
export function CollaborationNavigationHeader({
	isCollapsed,
	onCollapse,
}: CollaborationNavigationHeaderProps) {
	const label = isCollapsed ? "Expand navigation" : "Collapse navigation";
	return (
		<div
			className={cn(
				"flex h-11 items-center gap-2 pl-3",
				isCollapsed && "justify-center pl-0",
			)}
		>
			{!isCollapsed && (
				<Small className="min-w-0 flex-1 truncate font-medium text-sm">
					Collaboration
				</Small>
			)}
			{onCollapse && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0 text-muted-foreground"
							aria-label={label}
							aria-expanded={!isCollapsed}
							onClick={onCollapse}
						>
							{isCollapsed ? (
								<PanelLeftOpen aria-hidden="true" />
							) : (
								<PanelLeftClose aria-hidden="true" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">{label}</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
