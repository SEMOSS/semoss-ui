import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { Ref } from "react";
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

/** The desktop shell's collapse button; mobile navigation has none. */
export interface NavigationToggle {
	ref?: Ref<HTMLButtonElement>;
	/** Id of the region the button shows and hides. */
	controls: string;
	onToggle: () => void;
}

interface CollaborationNavigationHeaderProps {
	/** Shows only the workspace logo in compact navigation. */
	isCollapsed: boolean;
	/** Closes mobile navigation after returning to For you. */
	onNavigate?: () => void;
	toggle?: NavigationToggle;
}

/** Workspace identity with the sidebar's collapse button beside it. */
export function CollaborationNavigationHeader({
	isCollapsed,
	onNavigate,
	toggle,
}: CollaborationNavigationHeaderProps) {
	const toggleLabel = isCollapsed
		? "Expand navigation"
		: "Collapse navigation";
	const ToggleIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose;
	return (
		<div
			className={cn(
				"flex min-h-8 items-center gap-2 pl-2",
				isCollapsed && "flex-col justify-center gap-1 pl-0",
			)}
		>
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
			{toggle && (
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						<Button
							ref={toggle.ref}
							type="button"
							variant="ghost"
							size="icon-sm"
							className="pointer-coarse:size-11 shrink-0 text-muted-foreground"
							aria-label={toggleLabel}
							aria-expanded={!isCollapsed}
							aria-controls={toggle.controls}
							onClick={toggle.onToggle}
						>
							<ToggleIcon aria-hidden="true" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right">{toggleLabel}</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}
