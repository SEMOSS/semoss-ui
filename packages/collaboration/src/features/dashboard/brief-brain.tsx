import { Link } from "react-router";
import { P } from "@semoss/ui/next";
import { BriefPanel } from "./brief-panel";

/** Context directories stay separate from the shared pending review queue. */
export function BriefBrain() {
	return (
		<BriefPanel title="Brain">
			<P className="text-muted-foreground text-sm">
				Your topics, people, and remembered context.
			</P>
			<Link
				to="/brain"
				className="mt-4 inline-flex min-h-8 pointer-coarse:min-h-11 items-center rounded-sm border-b pb-1 text-sm hover:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
			>
				Open Brain →
			</Link>
			<nav
				aria-label="Brain directories"
				className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3"
			>
				{[
					["Topics", "/tasks/topics"],
					["People", "/brain/people"],
					["Threads", "/brain/threads"],
					["Sources", "/brain/sources"],
				].map(([label, to]) => (
					<Link
						key={to}
						to={to}
						className="inline-flex min-h-8 pointer-coarse:min-h-11 items-center rounded-sm text-muted-foreground text-xs hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
					>
						{label}
					</Link>
				))}
			</nav>
		</BriefPanel>
	);
}
