import { Info, X } from "lucide-react";
import { useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import {
	DEPENDENCY_FAMILIES,
	type DependencyFamily,
	type DependencyGraphIndex,
	FAMILY_ORDER,
} from "./dependency-graph";

interface DependencyMapLegendProps {
	/** The network, for the types it holds and their counts */
	index: DependencyGraphIndex;
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
	index,
	families,
	isShowingGaps,
}: DependencyMapLegendProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const counts = new Map<DependencyFamily, number>();
	for (const family of index.families.values()) {
		counts.set(family, (counts.get(family) ?? 0) + 1);
	}
	const links = [
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
				<Tooltip>
					<TooltipTrigger asChild>
						<CollapsibleTrigger asChild>
							<Button
								type="button"
								size="icon-sm"
								variant="outline"
								aria-label={
									isOpen
										? "Hide the legend"
										: "Show the legend"
								}
							>
								{isOpen ? (
									<X aria-hidden="true" />
								) : (
									<Info aria-hidden="true" />
								)}
							</Button>
						</CollapsibleTrigger>
					</TooltipTrigger>
					<TooltipContent>
						{isOpen ? "Hide the legend" : "Legend"}
					</TooltipContent>
				</Tooltip>
				<CollapsibleContent>
					<div className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-xs shadow-sm">
						<ul
							aria-label="Types"
							className="grid grid-cols-2 gap-x-4 gap-y-1"
						>
							{FAMILY_ORDER.filter((family) =>
								counts.has(family),
							).map((family) => {
								const config = DEPENDENCY_FAMILIES[family];
								const isShown =
									families === null || families.has(family);
								return (
									<li
										key={family}
										className={cn(
											"flex items-center gap-2",
											!isShown &&
												"text-muted-foreground line-through",
										)}
									>
										<span
											aria-hidden="true"
											className={cn(
												"size-2.5 rounded-full",
												config.swatchClass,
											)}
										/>
										<span className="flex-1">
											{config.label}
										</span>
										<span className="text-muted-foreground">
											{(
												counts.get(family) ?? 0
											).toLocaleString()}
										</span>
										{isShown ? null : (
											<span className="sr-only">
												(hidden)
											</span>
										)}
									</li>
								);
							})}
						</ul>
						<ul aria-label="Links" className="flex flex-col gap-1">
							{links.map((link) => (
								<li
									key={link.label}
									className="flex items-center gap-2"
								>
									<span
										aria-hidden="true"
										className={cn(
											"w-6 border-t-2",
											link.className,
										)}
									/>
									{link.label}
								</li>
							))}
						</ul>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
};
