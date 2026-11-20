import { Badge, H4, Muted } from "@semoss/ui/next";
import type { DependencyGraphEdge } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import { type DependencyGraphIndex, describeLink } from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";
import { useDependencyMapActions } from "./dependency-map-actions.context";

/** The most rows a list shows; a hub can be used by hundreds of items. */
const ROW_LIMIT = 200;

interface DependencyLinkListProps {
	/** The list's heading */
	title: string;
	/** The links */
	links: readonly DependencyGraphEdge[];
	/** Which end of each link to show */
	end: "source" | "target";
	/** The network */
	index: DependencyGraphIndex;
}

/**
 * A list of linked items in the inspector: each row jumps to its item, and its
 * role badge shows the link.
 */
export const DependencyLinkList = ({
	title,
	links,
	end,
	index,
}: DependencyLinkListProps) => {
	const { jumpTo, selectEdge } = useDependencyMapActions();
	return (
		<section className="flex flex-col gap-2" aria-label={title}>
			<H4 className="text-base">
				{title} ({links.length.toLocaleString()})
			</H4>
			{links.length === 0 ? (
				<Muted>None</Muted>
			) : (
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
								<button
									type="button"
									className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
									onClick={() => jumpTo(node.id)}
								>
									<DependencyItemImage
										node={node}
										className="size-6"
									/>
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-sm">
											{node.name}
										</span>
										<span className="truncate text-muted-foreground text-xs">
											{
												getDependencyTypeConfig(
													node.type,
												).label
											}
											{link.name ? ` · ${link.name}` : ""}
										</span>
									</span>
								</button>
								<button
									type="button"
									className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
									aria-label={`${role}, ${origin}: show this link`}
									onClick={() => selectEdge(link.id)}
								>
									<Badge
										variant={
											link.isAutomatic
												? "secondary"
												: "outline"
										}
									>
										{role}
									</Badge>
								</button>
							</li>
						);
					})}
				</ul>
			)}
			{links.length > ROW_LIMIT ? (
				<Muted>
					And {(links.length - ROW_LIMIT).toLocaleString()} more.
					Trace the item to see them all on the map.
				</Muted>
			) : null}
		</section>
	);
};
