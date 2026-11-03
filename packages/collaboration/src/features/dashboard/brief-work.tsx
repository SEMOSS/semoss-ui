import { Link } from "react-router";
import { H2 } from "@semoss/ui/next";
import { WorkItems } from "@/features/collaboration/components/work-items-list";

/** Today's view of Work: the owner's top work items, not a list of mail to answer (D25). */
export function BriefWork() {
	return (
		<section aria-label="Your work" className="min-w-0">
			<header className="mb-3 flex min-h-8 items-center justify-between gap-2 px-1">
				<H2 className="font-display font-semibold text-lg">
					Your work
				</H2>
				<Link
					to="/work"
					className="text-foreground text-sm hover:underline"
				>
					All work items
				</Link>
			</header>
			<WorkItems limit={6} />
		</section>
	);
}
