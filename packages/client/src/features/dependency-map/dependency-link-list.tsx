import { Muted } from "@semoss/ui/next";
import type { DependencyGraphEdge } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import { type DependencyGraphIndex, describeLink } from "./dependency-graph";
import { DependencyLinkRow } from "./dependency-link-row";

/** The most rows a list shows; a hub can be used by hundreds of items. */
const ROW_LIMIT = 200;

interface DependencyLinkListProps {
	/** The links */
	links: readonly DependencyGraphEdge[];
	/** Which end of each link to show */
	end: "source" | "target";
	/** The network */
	index: DependencyGraphIndex;
	/** Centers the canvas on an item and selects it */
	onJump: (id: string) => void;
	/** Opens a link in the drawer */
	onSelectEdge: (id: string) => void;
}

/**
 * A list of linked items in the drawer, which gives it its heading: each row
 * jumps to its item, and its role badge opens the link.
 */
export const DependencyLinkList = ({
	links,
	end,
	index,
	onJump,
	onSelectEdge,
}: DependencyLinkListProps) => {
	if (links.length === 0) {
		return <Muted>None</Muted>;
	}
	return (
		<>
			<ul className="flex flex-col gap-1">
				{links.slice(0, ROW_LIMIT).map((link) => {
					const node = index.nodes.get(link[end]);
					if (!node) {
						return null;
					}
					const { role, origin } = describeLink(link);
					return (
						<DependencyLinkRow
							key={link.id}
							node={node}
							description={`${getDependencyTypeConfig(node.type).label}${link.name ? ` · ${link.name}` : ""}`}
							link={{
								isAutomatic: link.isAutomatic,
								label: role,
							}}
							onOpenItem={() => onJump(node.id)}
							onOpenLink={() => onSelectEdge(link.id)}
							linkLabel={`${role}, ${origin}: show this link`}
						/>
					);
				})}
			</ul>
			{links.length > ROW_LIMIT ? (
				<Muted>
					And {(links.length - ROW_LIMIT).toLocaleString()} more.
					Trace the item to see them all in the ontology.
				</Muted>
			) : null}
		</>
	);
};
