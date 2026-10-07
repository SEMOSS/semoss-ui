import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "react-router";
import {
	Button,
	cn,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import semossLogo from "@/assets/img/semoss-logo.svg";

interface CollaborationNavigationHeaderProps {
	/** Shows the expand control in place of the workspace name. */
	isCollapsed: boolean;
	/** Toggles desktop navigation; omitted inside the mobile drawer. */
	onCollapse?: () => void;
	/** Closes mobile navigation after returning to For you. */
	onNavigate?: () => void;
}

/** Workspace identity and its visible desktop navigation toggle. */
export function CollaborationNavigationHeader({
	isCollapsed,
	onCollapse,
	onNavigate,
}: CollaborationNavigationHeaderProps) {
	const label = isCollapsed ? "Expand navigation" : "Collapse navigation";
	return (
		<div
			className={cn(
				"flex min-h-8 items-center gap-2 pl-2",
				isCollapsed && "justify-center pl-0",
			)}
		>
			{(!isCollapsed || !onCollapse) && (
				<Link
					to="/"
					onClick={onNavigate}
					aria-label="Collaboration"
					className={cn(
						"flex min-h-8 pointer-coarse:min-h-11 min-w-0 flex-1 items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-ring",
						isCollapsed && "justify-center",
					)}
				>
					<img
						src={semossLogo}
						alt=""
						width={24}
						height={28}
						className="h-7 w-6 shrink-0 dark:invert"
					/>
					{!isCollapsed && (
						<Small className="truncate font-medium text-sm">
							Collaboration
						</Small>
					)}
				</Link>
			)}
			{onCollapse && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
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
