import { Info, Lock } from "lucide-react";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
} from "@semoss/ui/next";
import {
	FAMILY_ORDER,
	getDependencyFamily,
} from "@/features/dependency-map/dependency-graph";
import {
	DependencyLegendLists,
	LEGEND_HEADING_CLASS,
	LEGEND_SECTION_CLASS,
	type LegendLink,
} from "@/features/dependency-map/dependency-legend-lists";
import type { DependencyAccess } from "./catalog-dependency";
import type { CatalogGraphNode } from "./catalog-dependency-graph";
import { DependencyAccessBadge } from "./dependency-access-badge";

/** Props for {@link CatalogDependencyLegend}. */
interface CatalogDependencyLegendProps {
	/** The nodes shown, for the types to explain */
	nodes: readonly CatalogGraphNode[];
}

const ACCESS_EXAMPLES: readonly {
	access: DependencyAccess;
	meaning: string;
}[] = [
	{
		access: { kind: "granted", level: "READ_ONLY" },
		meaning: "Your access",
	},
	{ access: { kind: "public" }, meaning: "Anyone can use it" },
	{ access: { kind: "requested", level: "READ_ONLY" }, meaning: "You asked" },
	{
		access: { kind: "requestable" },
		meaning: "You can see it and ask for access",
	},
	{
		access: { kind: "private" },
		meaning: "You can't see what it is; ask an owner",
	},
];

const LINKS: readonly LegendLink[] = [
	{
		label: "Automatic: from its configuration",
		className: "border-muted-foreground",
		icon: Lock,
	},
	{
		label: "Manual: added by a person",
		className: "border-muted-foreground border-dashed",
	},
];

/**
 * What the Ontology tab's graph shows: the colour of each type on it, the
 * two kinds of link, and what each access badge means. Behind a Legend
 * button, so the canvas stays clear.
 */
export const CatalogDependencyLegend = ({
	nodes,
}: CatalogDependencyLegendProps) => {
	const families = new Set(
		nodes
			.filter((node) => !node.isPrivate)
			.map((node) => getDependencyFamily(node.type)),
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm">
					<Info aria-hidden="true" />
					Legend
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="flex w-80 flex-col gap-3 text-xs"
			>
				<DependencyLegendLists
					families={FAMILY_ORDER.filter((family) =>
						families.has(family),
					).map((family) => ({ family }))}
					links={LINKS}
				/>
				<Separator />
				<section className={LEGEND_SECTION_CLASS}>
					<p className={LEGEND_HEADING_CLASS}>Access</p>
					<ul aria-label="Access" className="flex flex-col gap-1.5">
						{ACCESS_EXAMPLES.map(({ access, meaning }) => (
							<li
								key={access.kind}
								className="flex items-center gap-2"
							>
								{/* one column for the badges, so the meanings line up */}
								<span className="flex w-32 shrink-0">
									<DependencyAccessBadge access={access} />
								</span>
								<span className="min-w-0 text-muted-foreground">
									{meaning}
								</span>
							</li>
						))}
					</ul>
				</section>
			</PopoverContent>
		</Popover>
	);
};
