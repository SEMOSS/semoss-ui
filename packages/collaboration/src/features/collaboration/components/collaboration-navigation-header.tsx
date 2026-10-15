import { Link } from "react-router";
import { cn, Small } from "@semoss/ui/next";
import semossLogo from "@/assets/img/semoss-logo.svg";

interface CollaborationNavigationHeaderProps {
	/** Shows only the workspace logo in compact navigation. */
	isCollapsed: boolean;
	/** Closes mobile navigation after returning to For you. */
	onNavigate?: () => void;
}

/** Workspace identity stays separate from the sidebar rail control. */
export function CollaborationNavigationHeader({
	isCollapsed,
	onNavigate,
}: CollaborationNavigationHeaderProps) {
	return (
		<div
			className={cn(
				"flex min-h-8 items-center gap-2 pl-2",
				isCollapsed && "justify-center pl-0",
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
		</div>
	);
}
