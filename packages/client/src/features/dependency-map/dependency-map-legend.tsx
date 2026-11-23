import { Info, X } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@semoss/ui/next";
import { type DependencyFamily, FAMILY_ORDER } from "./dependency-graph";
import {
	DependencyLegendLists,
	type LegendLink,
} from "./dependency-legend-lists";
import { MapOverlayCard } from "./map-overlay-card";
import { MapTooltip } from "./map-tooltip";

interface DependencyMapLegendProps {
	/** How many items of each family the network holds */
	familyCounts: ReadonlyMap<DependencyFamily, number>;
	/** The types shown, or null for all; the others are struck through */
	families: ReadonlySet<DependencyFamily> | null;
	/** Whether access gaps are drawn, so their line is explained */
	isShowingGaps: boolean;
}

/**
 * The map's one legend, on the canvas: each type's colour with its count, and
 * the link styles. It starts folded behind an icon on the canvas's top right,
 * so the canvas stays clear.
 */
export const DependencyMapLegend = ({
	familyCounts: counts,
	families,
	isShowingGaps,
}: DependencyMapLegendProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggleLabel = isOpen ? "Hide the legend" : "Show the legend";
	const links: LegendLink[] = [
		{ label: "Automatic link", className: "border-muted-foreground" },
		{
			label: "Manual link",
			className: "border-muted-foreground border-dashed",
		},
		{ label: "In a cycle", className: "border-warning" },
		...(isShowingGaps
			? [{ label: "Can't follow", className: "border-destructive" }]
			: []),
	];

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="flex flex-col items-end gap-2">
				<MapTooltip label={toggleLabel}>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							size="icon-sm"
							variant="outline"
							aria-label={toggleLabel}
						>
							{isOpen ? (
								<X aria-hidden="true" />
							) : (
								<Info aria-hidden="true" />
							)}
						</Button>
					</CollapsibleTrigger>
				</MapTooltip>
				<CollapsibleContent>
					<MapOverlayCard className="flex flex-col gap-3 p-3 text-xs">
						<DependencyLegendLists
							families={FAMILY_ORDER.filter((family) =>
								counts.has(family),
							).map((family) => ({
								family,
								count: counts.get(family) ?? 0,
								isShown:
									families === null || families.has(family),
							}))}
							links={links}
						/>
					</MapOverlayCard>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};
