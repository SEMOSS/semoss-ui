import { ArrowRight } from "lucide-react";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
	Muted,
} from "@semoss/ui/next";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import {
	getDependencyRoleLabel,
	getDependencyTypeConfig,
} from "./catalog-dependency";
import type { GraphNodeLink } from "./catalog-dependency-graph";
import { DependencyKindBadge } from "./dependency-kind-badge";

/** Props for {@link DependencyLinkRow}. */
interface DependencyLinkRowProps extends GraphNodeLink {
	/** Opens an item in the drawer */
	onSelect: (id: string) => void;
}

/**
 * One link in the Ontology drawer's Lineage: the item at its other end, which
 * opens in the drawer, then what kind of link it is. An automatic link reads
 * Automatic, with its role and the sentence the backend wrote, set by the
 * configuration of the item that has it; a manual one reads Manual, with the
 * name a user gave it, in the code face a Code app reads it by, and its
 * description. The link to the private dependents has neither.
 */
export const DependencyLinkRow = ({
	edge,
	other,
	sourceType,
	onSelect,
}: DependencyLinkRowProps) => {
	const isHidden = edge.role === "HIDDEN";
	const note = isHidden
		? null
		: edge.isAutomatic
			? (edge.description ??
				`Set by the ${getDependencyTypeConfig(sourceType).label.toLowerCase()}'s configuration.`)
			: edge.description;
	return (
		<li className="flex flex-col gap-1 py-2">
			<Item
				asChild
				size="sm"
				className="flex-nowrap px-2 py-1.5 text-left"
			>
				<button type="button" onClick={() => onSelect(other.id)}>
					<ItemMedia>
						<DependencyItemImage
							node={other}
							isPrivate={other.isPrivate}
							className="size-6"
						/>
					</ItemMedia>
					<ItemContent className="min-w-0">
						<ItemTitle
							className="w-full truncate"
							title={other.name}
						>
							{other.name}
						</ItemTitle>
					</ItemContent>
					<ItemActions>
						<ArrowRight
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
					</ItemActions>
				</button>
			</Item>
			{isHidden ? null : (
				// lined up with the row's padding above
				<div className="flex min-w-0 flex-wrap items-center gap-2 px-2">
					<DependencyKindBadge isAutomatic={edge.isAutomatic} />
					{edge.isAutomatic ? (
						<span className="text-muted-foreground text-xs">
							{getDependencyRoleLabel(edge.role)}
						</span>
					) : edge.name ? (
						<code className="min-w-0 break-all font-medium font-mono text-xs">
							{edge.name}
						</code>
					) : (
						<span className="text-muted-foreground text-xs">
							No name
						</span>
					)}
				</div>
			)}
			{note ? <Muted className="px-2 text-xs">{note}</Muted> : null}
		</li>
	);
};
