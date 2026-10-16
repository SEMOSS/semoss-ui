import { Fragment } from "react";
import { NavLink } from "react-router";
import { Button } from "@semoss/ui/next";
import { threadNeedsTopic } from "@/features/collaboration/state/collaboration.selectors";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { suggestedMemories } from "@/features/collaboration/state/memory";

// Old Brain routes stay as they are so links and bookmarks keep working.
// Order: your account and connections, then what the assistant knows, then the app itself.
export const SETUP_DESTINATIONS: {
	to: string;
	label: string;
	count?: (state: CollaborationState) => number;
	/** Starts a new group, shown with a divider before it. */
	startsGroup?: boolean;
}[] = [
	{ to: "/settings/about-you", label: "About you" },
	{ to: "/brain/sources", label: "Connections" },
	{ to: "/settings/email", label: "Email" },
	{ to: "/brain/topics", label: "Topics", startsGroup: true },
	{
		to: "/brain",
		label: "Review",
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
	{ to: "/settings/rules", label: "Rules" },
	{ to: "/settings/appearance", label: "Appearance", startsGroup: true },
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
			{SETUP_DESTINATIONS.map(({ to, label, count, startsGroup }) => {
				const total = count?.(state) ?? 0;
				return (
					<Fragment key={to}>
						{startsGroup && (
							<span
								aria-hidden="true"
								className="mx-1 my-2 w-px self-stretch bg-border"
							/>
						)}
						<Button
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
					</Fragment>
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
