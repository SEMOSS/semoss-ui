import { ChevronUp, LogOut, Settings } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	P,
	Small,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { CollaborationAccountContext } from "./collaboration-account.context";
import { PersonAvatar } from "./person-avatar";

// Match the shell's switch between the desktop rail and mobile navigation.
const DESKTOP_NAVIGATION_QUERY = "(min-width: 64rem)";

interface CollaborationProfileMenuProps {
	/** Shows only the avatar in the collapsed desktop rail. */
	isCollapsed?: boolean;
	/** Closes mobile navigation and focuses the selected destination. */
	onNavigate?: () => void;
}

/** Account actions use the current session and leave failed logout attempts retryable. */
export function CollaborationProfileMenu({
	isCollapsed = false,
	onNavigate,
}: CollaborationProfileMenuProps) {
	const { state } = useCollaborationSession();
	const account = useContext(CollaborationAccountContext);
	const [isOpen, setIsOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const isNavigating = useRef(false);
	useEffect(() => {
		const media = window.matchMedia?.(DESKTOP_NAVIGATION_QUERY);
		if (!media) return;
		const handleChange = () => setIsOpen(false);
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, []);
	const name =
		state.liveProfile?.name?.trim() || state.profile.name.trim() || "You";
	const email = state.liveProfile?.email || state.profile.email;
	if (!account)
		throw new Error(
			"CollaborationProfileMenu requires an account controller",
		);
	const { isLoggingOut, error, isLogoutPending, logout } = account;

	return (
		<DropdownMenu
			open={isOpen}
			onOpenChange={(open) => {
				if (open) isNavigating.current = false;
				setIsOpen(open);
			}}
		>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							ref={triggerRef}
							type="button"
							variant="ghost"
							className={cn(
								"h-auto min-h-11 w-full min-w-0 justify-start gap-2 rounded-lg px-2 py-1 font-normal text-sidebar-foreground text-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid focus-visible:ring-0 has-[>svg]:px-2 aria-[expanded=true]:bg-sidebar-accent dark:hover:bg-sidebar-accent",
								isCollapsed && "justify-center px-0",
							)}
							aria-label={`Account menu for ${name}`}
						>
							<PersonAvatar
								name={name}
								className="size-8 shrink-0"
								tone="bg-primary/10 text-primary"
							/>
							{!isCollapsed && (
								<>
									<span className="min-w-0 flex-1 truncate text-left">
										{name}
									</span>
									<ChevronUp
										aria-hidden="true"
										className="size-3.5 text-muted-foreground"
									/>
								</>
							)}
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				{isCollapsed && (
					<TooltipContent
						side="right"
						className="max-w-64 break-words"
					>
						Account menu for {name}
					</TooltipContent>
				)}
			</Tooltip>
			<DropdownMenuContent
				align="start"
				side="top"
				className="w-64 motion-reduce:animate-none"
				onCloseAutoFocus={(event) => {
					if (
						isNavigating.current ||
						!triggerRef.current?.getClientRects().length
					)
						event.preventDefault();
				}}
			>
				<DropdownMenuLabel className="space-y-1 px-2 py-2">
					<P className="break-words font-medium text-sm">{name}</P>
					{email && (
						<Small className="block break-words font-normal text-muted-foreground text-xs">
							{email}
						</Small>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					asChild
					disabled={isLoggingOut}
					className="pointer-coarse:min-h-11"
				>
					<Link
						to="/settings"
						onClick={(event) => {
							if (isLogoutPending.current) {
								event.preventDefault();
								return;
							}
							if (onNavigate) {
								isNavigating.current = true;
								onNavigate();
							}
						}}
					>
						<Settings aria-hidden="true" />
						Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					disabled={isLoggingOut}
					className="pointer-coarse:min-h-11"
					onSelect={(event) => {
						event.preventDefault();
						void logout();
					}}
				>
					{isLoggingOut ? (
						<Spinner aria-hidden="true" />
					) : (
						<LogOut aria-hidden="true" />
					)}
					{isLoggingOut ? "Logging out…" : "Log out"}
				</DropdownMenuItem>
				{error && (
					<P
						role="alert"
						className="px-2 py-2 text-destructive text-sm"
					>
						{error}
					</P>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
