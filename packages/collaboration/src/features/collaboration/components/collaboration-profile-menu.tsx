import { Moon, Sun } from "lucide-react";
import { NavLink } from "react-router";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useTheme,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";

interface CollaborationProfileMenuProps {
	/** Shows an avatar and compact controls when navigation is collapsed. */
	isCollapsed: boolean;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
}

/** The profile opens Settings directly, with appearance available beside it. */
export function CollaborationProfileMenu({
	isCollapsed,
	onNavigate,
}: CollaborationProfileMenuProps) {
	const { state } = useCollaborationSession();
	const { resolvedTheme, setTheme } = useTheme();
	const name = state.liveProfile?.name || state.profile.name || "You";
	const themeLabel =
		resolvedTheme === "dark"
			? "Switch to light theme"
			: "Switch to dark theme";
	return (
		<footer
			className={cn(
				"mx-2 flex shrink-0 items-center gap-1 border-border border-t py-2",
				isCollapsed && "flex-col",
			)}
		>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						asChild
						variant="ghost"
						size="sm"
						className={cn(
							"h-auto min-h-8 pointer-coarse:min-h-11 min-w-0 flex-1 justify-start gap-2 px-2 py-1 font-medium text-xs hover:bg-sidebar-accent",
							isCollapsed && "w-full justify-center px-0",
						)}
					>
						<NavLink
							to="/settings"
							onClick={onNavigate}
							aria-label={`Settings for ${name}`}
						>
							<PersonAvatar
								name={name}
								className="size-6"
								tone="bg-primary/10 text-primary"
							/>
							{!isCollapsed && (
								<span className="truncate">{name}</span>
							)}
						</NavLink>
					</Button>
				</TooltipTrigger>
				<TooltipContent side={isCollapsed ? "right" : "top"}>
					Settings for {name}
				</TooltipContent>
			</Tooltip>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={themeLabel}
						className="pointer-coarse:min-h-11 pointer-coarse:min-w-11 shrink-0 text-muted-foreground"
						onClick={() => {
							try {
								setTheme(
									resolvedTheme === "dark" ? "light" : "dark",
								);
							} catch {
								toast.error(
									"Your theme could not be saved. Allow browser storage and try again.",
								);
							}
						}}
					>
						{resolvedTheme === "dark" ? (
							<Sun aria-hidden="true" />
						) : (
							<Moon aria-hidden="true" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="top">{themeLabel}</TooltipContent>
			</Tooltip>
		</footer>
	);
}
