import {
	Badge,
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
	Muted,
} from "@semoss/ui/next";
import type { DependencyGraphEdge } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import { type DependencyGraphIndex, describeLink } from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";

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
						<li
							key={link.id}
							className="flex min-w-0 items-center gap-1"
						>
							<Item
								asChild
								size="sm"
								className="min-w-0 flex-1 flex-nowrap px-2 py-1.5 text-left"
							>
								<button
									type="button"
									onClick={() => onJump(node.id)}
								>
									<ItemMedia>
										<DependencyItemImage
											node={node}
											className="size-6"
										/>
									</ItemMedia>
									<ItemContent className="min-w-0 gap-0">
										<ItemTitle
											className="w-full truncate font-normal"
											title={node.name}
										>
											{node.name}
										</ItemTitle>
										<ItemDescription className="truncate text-xs">
											{
												getDependencyTypeConfig(
													node.type,
												).label
											}
											{link.name ? ` · ${link.name}` : ""}
										</ItemDescription>
									</ItemContent>
								</button>
							</Item>
							<Badge
								asChild
								variant={
									link.isAutomatic ? "secondary" : "outline"
								}
							>
								<button
									type="button"
									className="shrink-0"
									aria-label={`${role}, ${origin}: show this link`}
									onClick={() => onSelectEdge(link.id)}
								>
									{role}
								</button>
							</Badge>
						</li>
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
