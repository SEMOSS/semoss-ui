import { UserRound } from "lucide-react";
import { Link } from "react-router";
import {
	Avatar,
	AvatarFallback,
	Button,
	cn,
	Muted,
	Small,
} from "@semoss/ui/next";
import { buildInitials } from "@semoss/utility";
import { useCurrentUser } from "@/features/account/api/use-current-user";

/**
 * The sidebar's account block, linking to settings. Collapses to the avatar
 * only when `condensed`.
 */
export function SidebarFooter({ condensed }: { condensed: boolean }) {
	const { name, email, isLoading, error, refresh } = useCurrentUser();
	const displayName = isLoading ? "Loading account…" : name || "Your account";
	const initials = buildInitials(name);

	return (
		<div
			className={cn(
				"mt-auto pt-8 motion-safe:transition-[padding,gap,opacity] motion-safe:duration-300 motion-safe:ease-in-out",
				condensed ? "flex flex-col items-center gap-4" : "px-2",
			)}
		>
			<Link
				to="/settings"
				aria-label={`${displayName} — Open account settings`}
				aria-busy={isLoading}
				title={
					email && email !== name
						? `${displayName} · ${email}`
						: displayName
				}
				className={cn(
					"flex min-w-0 items-center gap-2.5 rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-in-out",
					condensed
						? "justify-center p-1"
						: "border-t px-1 pt-4 pb-1",
				)}
			>
				<Avatar aria-hidden="true" className="border">
					<AvatarFallback className="bg-background font-medium text-xs">
						{initials || <UserRound className="size-4" />}
					</AvatarFallback>
				</Avatar>
				{!condensed && (
					<div className="min-w-0 flex-1">
						<Small className="truncate text-xs leading-4">
							{displayName}
						</Small>
						{email && email !== name && (
							<Muted className="block truncate text-xs">
								{email}
							</Muted>
						)}
					</div>
				)}
			</Link>
			{error && (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={
						condensed ? "Retry loading your profile" : undefined
					}
					onClick={refresh}
				>
					{condensed ? "Retry" : "Profile unavailable · Retry"}
				</Button>
			)}
		</div>
	);
}
