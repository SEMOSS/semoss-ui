import { LogOut, Settings } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useSession } from "@semoss/sdk/react";
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
import { givenFirst } from "@/lib/person-name";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { PersonAvatar } from "./person-avatar";

interface CollaborationProfileMenuProps {
	/** Compact navigation shows only the avatar icon. */
	isCollapsed?: boolean;
	/** Closes mobile navigation after choosing a destination. */
	onNavigate?: () => void;
}

/** Account actions use the current session and leave failed logout attempts retryable. */
export function CollaborationProfileMenu({
	isCollapsed = false,
	onNavigate,
}: CollaborationProfileMenuProps) {
	const { state } = useCollaborationSession();
	const logout = useSession((state) => state.logout);
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [error, setError] = useState("");
	const isLogoutPending = useRef(false);
	const name =
		state.liveProfile?.name?.trim() || state.profile.name.trim() || "You";
	const email = state.liveProfile?.email || state.profile.email;

	/** End the SDK session before replacing the current location. */
	async function handleLogout(): Promise<void> {
		if (isLogoutPending.current) return;
		isLogoutPending.current = true;
		setIsLoggingOut(true);
		setError("");
		try {
			// throws when refused; the login page then reads the signed out session
			await logout();
			await navigate("/login", { replace: true });
		} catch {
			setError("Could not log out. Please try again.");
			setIsOpen(true);
		} finally {
			isLogoutPending.current = false;
			setIsLoggingOut(false);
		}
	}

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<Tooltip disableHoverableContent={false}>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size={isCollapsed ? "icon" : "sm"}
							className={cn(
								"min-h-9 pointer-coarse:min-h-11 w-full justify-start gap-2 rounded-lg px-2 font-normal text-xs",
								isCollapsed &&
									"size-11 justify-center rounded-full px-0",
							)}
							aria-label={`Account menu for ${name}`}
						>
							<PersonAvatar
								name={name}
								email={email}
								className="size-7 shrink-0"
								tone="bg-primary/10 text-primary"
							/>
							{!isCollapsed && (
								<span className="min-w-0 truncate text-foreground">
									{givenFirst(name)}
								</span>
							)}
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				{isCollapsed && (
					<TooltipContent side="right">Account</TooltipContent>
				)}
			</Tooltip>
			<DropdownMenuContent
				align="start"
				side="top"
				className="w-64 motion-reduce:animate-none"
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
							onNavigate?.();
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
						void handleLogout();
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
