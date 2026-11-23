import type { LucideIcon } from "lucide-react";
import { cn, Separator } from "@semoss/ui/next";
import { DEPENDENCY_FAMILIES, type DependencyFamily } from "./dependency-graph";

/** A legend section: its small heading above its list. */
export const LEGEND_SECTION_CLASS = "flex flex-col gap-2";

/** A legend section's heading. */
export const LEGEND_HEADING_CLASS = "font-medium text-foreground";

/** A type's colour dot; add the family's `swatchClass`. */
export const FAMILY_SWATCH_CLASS = "size-2.5 rounded-full";

/** One type in a legend. */
interface LegendFamily {
	/** The type */
	readonly family: DependencyFamily;
	/** How many items of it the graph holds, shown after its name */
	readonly count?: number;
	/** False when the filters leave it out: struck through */
	readonly isShown?: boolean;
}

/** One link style in a legend. */
export interface LegendLink {
	/** What the style means */
	readonly label: string;
	/** Its line's border colour and style */
	readonly className: string;
	/** The mark the link carries at its midpoint, such as a lock */
	readonly icon?: LucideIcon;
}

/** Props for {@link DependencyLegendLists}. */
interface DependencyLegendListsProps {
	/** The types, in the order shown; the list is left out when empty */
	families: readonly LegendFamily[];
	/** The link styles */
	links: readonly LegendLink[];
}

/**
 * The sections a dependency graph's legend holds, each under a small heading
 * and kept apart by a rule: Types (each type's colour and name, with its
 * count and struck through when filtered out where the caller says), then
 * Links (each link style's line, its mark, and its meaning, the labels lined
 * up). The caller frames them; the admin Ontology and the Ontology tab share
 * them.
 */
export const DependencyLegendLists = ({
	families,
	links,
}: DependencyLegendListsProps) => (
	<>
		{families.length > 0 ? (
			<>
				<section className={LEGEND_SECTION_CLASS}>
					<p className={LEGEND_HEADING_CLASS}>Types</p>
					<ul
						aria-label="Types"
						className="grid grid-cols-2 gap-x-4 gap-y-1.5"
					>
						{families.map(({ family, count, isShown = true }) => {
							const config = DEPENDENCY_FAMILIES[family];
							return (
								<li
									key={family}
									className={cn(
										"flex min-w-0 items-center gap-2",
										!isShown &&
											"text-muted-foreground line-through",
									)}
								>
									<span
										aria-hidden="true"
										className={cn(
											FAMILY_SWATCH_CLASS,
											"shrink-0",
											config.swatchClass,
										)}
									/>
									<span className="min-w-0 flex-1 truncate">
										{config.label}
									</span>
									{count === undefined ? null : (
										<span className="text-muted-foreground tabular-nums">
											{count.toLocaleString()}
										</span>
									)}
									{isShown ? null : (
										<span className="sr-only">
											(hidden)
										</span>
									)}
								</li>
							);
						})}
					</ul>
				</section>
				<Separator />
			</>
		) : null}
		<section className={LEGEND_SECTION_CLASS}>
			<p className={LEGEND_HEADING_CLASS}>Links</p>
			<ul aria-label="Links" className="flex flex-col gap-1.5">
				{links.map((link) => (
					<li key={link.label} className="flex items-center gap-2">
						<span
							aria-hidden="true"
							className={cn(
								"w-6 shrink-0 border-t-2",
								link.className,
							)}
						/>
						{/* the same slot with or without a mark, so labels line up */}
						<span className="flex size-3 shrink-0 items-center justify-center">
							{link.icon ? (
								<link.icon
									className="size-3 text-muted-foreground"
									aria-hidden="true"
								/>
							) : null}
						</span>
						<span className="min-w-0">{link.label}</span>
					</li>
				))}
			</ul>
		</section>
	</>
);
