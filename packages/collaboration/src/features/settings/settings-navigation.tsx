import { NavLink } from "react-router";
import { Button } from "@semoss/ui/next";
import { threadNeedsTopic } from "@/features/collaboration/state/collaboration.selectors";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { suggestedMemories } from "@/features/collaboration/state/memory";

// Old Brain routes stay as they are so links and bookmarks keep working
export const SETUP_DESTINATIONS: {
	to: string;
	label: string;
	count?: (state: CollaborationState) => number;
}[] = [
	{ to: "/settings/about-you", label: "About you" },
	{
		to: "/brain",
		label: "Topics and filing",
		count: (state) =>
			state.reviews.filter((review) => review.status === "open").length,
	},
	{
		to: "/brain/threads",
		label: "Conversations",
		count: (state) => state.threads.filter(threadNeedsTopic).length,
	},
	{ to: "/brain/people", label: "People" },
	{
		to: "/brain/memory",
		label: "Memory",
		count: (state) => suggestedMemories(state.memories).length,
	},
	{ to: "/brain/sources", label: "Sources" },
	{ to: "/settings/rules", label: "Rules" },
	{ to: "/settings/appearance", label: "Appearance" },
	{ to: "/settings/data", label: "Data" },
];

/** Everything the owner sets up once, in one tab bar shared by Settings and the setup pages. */
export function SettingsNavigation({
	onNavigate,
}: {
	/** Runs after choosing a destination. */
	onNavigate?: () => void;
}) {
	const { state } = useCollaborationSession();
	return (
		<nav aria-label="Settings" className="flex flex-wrap gap-1">
			{SETUP_DESTINATIONS.map(({ to, label, count }) => {
				const total = count?.(state) ?? 0;
				return (
					<Button
						key={to}
						asChild
						variant="ghost"
						size="sm"
						className="h-9 pointer-coarse:min-h-11 gap-1.5 px-3 font-normal text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground"
					>
						<NavLink
							to={to}
							end={to === "/brain"}
							onClick={onNavigate}
						>
							{label}
							{total > 0 && (
								<span className="text-muted-foreground text-xs tabular-nums">
									{total}
								</span>
							)}
						</NavLink>
					</Button>
				);
			})}
		</nav>
	);
}

/** The tab bar strip placed above Settings and setup page content. */
export function SettingsTabBar() {
	return (
		<div className="shrink-0 bg-muted/15 px-4 pt-4 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-screen-2xl">
				<SettingsNavigation />
			</div>
		</div>
	);
}
