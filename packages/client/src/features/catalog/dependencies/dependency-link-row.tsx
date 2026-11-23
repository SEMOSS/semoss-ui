import { ArrowRight, Lock } from "lucide-react";
import {
	Badge,
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

/** Props for {@link DependencyLinkRow}. */
interface DependencyLinkRowProps extends GraphNodeLink {
	/** Opens an item in the drawer */
	onSelect: (id: string) => void;
}

/**
 * One link in the Ontology drawer's Lineage: the item at its other end, which
 * opens in the drawer, then its role and why it exists. An automatic link's
 * role has a lock and says it is set by the configuration of the item that
 * has it; a manual one reads Manual, with the name and description a user
 * gave it. The link to the private dependents has no role.
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
				<div className="flex flex-wrap items-center gap-1 px-2">
					<Badge variant="secondary" className="gap-1">
						{edge.isAutomatic ? (
							<Lock className="size-3" aria-hidden="true" />
						) : null}
						{getDependencyRoleLabel(edge.role)}
					</Badge>
					{edge.name ? (
						<Badge
							variant="outline"
							className="max-w-40"
							title={edge.name}
						>
							<span className="truncate">{edge.name}</span>
						</Badge>
					) : null}
				</div>
			)}
			{note ? <Muted className="px-2 text-xs">{note}</Muted> : null}
		</li>
	);
};
