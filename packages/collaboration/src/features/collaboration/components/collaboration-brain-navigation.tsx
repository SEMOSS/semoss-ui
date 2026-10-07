import { NavLink } from "react-router";
import { Button } from "@semoss/ui/next";

const BRAIN_DESTINATIONS = [
	{ to: "/brain", label: "Review" },
	{ to: "/brain/memory", label: "Memory" },
	{ to: "/brain/people", label: "People" },
	{ to: "/brain/threads", label: "Threads" },
	{ to: "/brain/sources", label: "Sources" },
];

/** Keeps Brain's directories together without adding another sidebar. */
export function CollaborationBrainNavigation({
	onNavigate,
}: {
	/** Runs after choosing a Brain destination. */
	onNavigate?: () => void;
}) {
	return (
		<nav aria-label="Brain" className="flex flex-wrap gap-1">
			{BRAIN_DESTINATIONS.map(({ to, label }) => (
				<Button
					key={to}
					asChild
					variant="ghost"
					size="sm"
					className="h-9 pointer-coarse:min-h-11 px-3 font-normal text-muted-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground"
				>
					<NavLink to={to} end={to === "/brain"} onClick={onNavigate}>
						{label}
					</NavLink>
				</Button>
			))}
		</nav>
	);
}
