import { ArrowDown, ArrowUp } from "lucide-react";
import type { ReactNode } from "react";
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
} from "@semoss/ui/next";

/** Props for {@link DrawerLineage}. */
interface DrawerLineageProps {
	/** How many items the item uses, shown on the heading */
	upstreamCount: number;
	/** How many items use the item, shown on the heading */
	downstreamCount: number;
	/** The list of what it uses */
	upstream: ReactNode;
	/** The list of what uses it */
	downstream: ReactNode;
	/** A line beside the Upstream heading, such as how many in all */
	upstreamNote?: string;
	/** A line beside the Downstream heading */
	downstreamNote?: string;
}

/**
 * A dependency drawer's Lineage section, in its accordion: its heading with
 * the upstream and downstream counts as badges, then Upstream (what the item
 * uses) and Downstream (what uses it), each a list the drawer gives. The
 * admin Ontology and the Ontology tab share it.
 */
export const DrawerLineage = ({
	upstreamCount,
	downstreamCount,
	upstream,
	downstream,
	upstreamNote,
	downstreamNote,
}: DrawerLineageProps) => (
	<AccordionItem value="lineage">
		<AccordionTrigger
			aria-label={`Lineage, ${upstreamCount} upstream, ${downstreamCount} downstream`}
		>
			<span className="flex items-center gap-2">
				Lineage
				<Badge variant="secondary" className="gap-0.5">
					<ArrowUp className="size-3" aria-hidden="true" />
					{upstreamCount}
				</Badge>
				<Badge variant="secondary" className="gap-0.5">
					<ArrowDown className="size-3" aria-hidden="true" />
					{downstreamCount}
				</Badge>
			</span>
		</AccordionTrigger>
		<AccordionContent className="flex flex-col gap-4">
			{(
				[
					["Upstream", upstream, upstreamNote],
					["Downstream", downstream, downstreamNote],
				] as const
			).map(([title, list, note]) => (
				<section
					key={title}
					aria-label={title}
					className="flex flex-col gap-2"
				>
					<p className="flex items-baseline justify-between gap-2 text-sm">
						<span className="font-medium">{title}</span>
						{note ? (
							<span className="text-muted-foreground text-xs">
								{note}
							</span>
						) : null}
					</p>
					{list}
				</section>
			))}
		</AccordionContent>
	</AccordionItem>
);
