import { Link } from "react-router";
import { cn } from "@semoss/ui/next";

/**
 * The sidebar's account block, linking to settings. Collapses to the avatar
 * only when `condensed`.
 */
export function SidebarFooter({ condensed }: { condensed: boolean }) {
	return (
		<div
			className={cn(
				"mt-auto pt-8 transition-[padding,gap,opacity] duration-300 ease-in-out",
				condensed ? "flex flex-col items-center gap-4" : "px-2",
			)}
		>
			<Link
				to="/settings"
				aria-label="Open account settings"
				className={cn(
					"flex min-w-0 items-center gap-2.5 rounded-md transition-all duration-300 ease-in-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					condensed
						? "justify-center p-1"
						: "border-t px-1 pt-4 pb-1",
				)}
			>
				<span
					title="Prabhu Kapaleeswaran"
					className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background font-medium text-xs"
				>
					PK
				</span>
				{!condensed && (
					<span className="min-w-0 flex-1">
						<strong className="block truncate font-medium text-xs leading-4">
							Prabhu Kapaleeswaran
						</strong>
						<span className="block truncate text-muted-foreground text-xs">
							Deloitte
						</span>
					</span>
				)}
			</Link>
		</div>
	);
}
