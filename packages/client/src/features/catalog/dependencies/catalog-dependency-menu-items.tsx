import {
	ExternalLink,
	Info,
	LockKeyhole,
	Maximize,
	Minus,
	Network,
	Pencil,
	Plus,
	Trash2,
	Undo2,
} from "lucide-react";
import { Link } from "react-router";
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
} from "@semoss/ui/next";
import type { GraphMenuTarget } from "@/features/dependency-map/dependency-flow-canvas";
import { canRequestDependency } from "./catalog-dependency";
import type { CanvasEditState } from "./catalog-dependency-canvas";
import { getOwnDraftLink } from "./catalog-dependency-draft";
import {
	type CatalogDependencyGraph,
	type CatalogGraphNode,
	type DependencyGraphView,
	getGraphNodePaths,
} from "./catalog-dependency-graph";

/** What the menu offers while the owner's links are edited. */
export interface MenuEditActions extends CanvasEditState {
	/** Opens Add Dependency */
	readonly onAdd: () => void;
	/** Opens a manual link's target with the link's form */
	readonly onEditLink: (id: string) => void;
}

/** Props for {@link CatalogDependencyMenuItems}. */
interface CatalogDependencyMenuItemsProps {
	/** What was right-clicked */
	target: GraphMenuTarget;
	/** The owner's graph */
	graph: CatalogDependencyGraph;
	/** What the canvas shows, for what an item leaves out beyond it */
	view: DependencyGraphView;
	/** The items whose next level is shown */
	expandedIds: ReadonlySet<string>;
	/** Opens an item in the drawer */
	onOpenDetails: (id: string) => void;
	/** Shows the items one link further out from an item */
	onExpand: (id: string) => void;
	/** Hides them again */
	onCollapse: (id: string) => void;
	/** Asks for access to an item */
	onRequestAccess: (node: CatalogGraphNode) => void;
	/** Fits the canvas to what it shows */
	onFitView: () => void;
	/** Goes back to the direct links only */
	onShowDirectOnly: () => void;
	/** The edit actions, while the owner's links are edited */
	edit?: MenuEditActions;
}

/**
 * The Ontology tab's right-click menu. On an item: open its details, show or
 * hide the next level beyond it (the way to walk further than the direct
 * links), ask for access, open it in the catalog, or go to its own Ontology.
 * On the empty canvas: fit the view, and go back to the direct links. Each
 * action shows only where it applies, so a private item offers only its
 * details. While the owner's links are edited, the empty canvas offers Add
 * Dependency, and a manual link's target Edit Link and Remove Dependency (or
 * Undo Removal).
 */
export const CatalogDependencyMenuItems = ({
	target,
	graph,
	view,
	expandedIds,
	onOpenDetails,
	onExpand,
	onCollapse,
	onRequestAccess,
	onFitView,
	onShowDirectOnly,
	edit,
}: CatalogDependencyMenuItemsProps) => {
	const node =
		target.kind === "node" ? graph.nodes.get(target.id) : undefined;
	if (!node) {
		return (
			<>
				{edit ? (
					<>
						<ContextMenuItem onSelect={edit.onAdd}>
							<Plus aria-hidden="true" />
							Add Dependency
						</ContextMenuItem>
						<ContextMenuSeparator />
					</>
				) : null}
				<ContextMenuItem onSelect={onFitView}>
					<Maximize aria-hidden="true" />
					Fit View
				</ContextMenuItem>
				<ContextMenuItem
					onSelect={onShowDirectOnly}
					disabled={expandedIds.size === 0}
				>
					<Undo2 aria-hidden="true" />
					Show Direct Links Only
				</ContextMenuItem>
			</>
		);
	}

	const hiddenChildren =
		view.nodes.find((placed) => placed.id === node.id)?.hiddenChildren ?? 0;
	const isExpanded = expandedIds.has(node.id);
	const { catalogPath, ontologyPath } = getGraphNodePaths(graph, node);
	const isRequestable = node.access
		? canRequestDependency(node.access)
		: false;
	const hasItemActions = catalogPath !== null || isRequestable;
	// only the owner's own manual links are edited here
	const draftLink = getOwnDraftLink(node, edit?.links ?? null);

	return (
		<>
			<ContextMenuLabel className="truncate" title={node.name}>
				{node.name}
			</ContextMenuLabel>
			<ContextMenuSeparator />
			<ContextMenuItem onSelect={() => onOpenDetails(node.id)}>
				<Info aria-hidden="true" />
				Open Details
			</ContextMenuItem>
			{edit ? null : isExpanded ? (
				<ContextMenuItem onSelect={() => onCollapse(node.id)}>
					<Minus aria-hidden="true" />
					Hide Next Level
				</ContextMenuItem>
			) : hiddenChildren > 0 ? (
				<ContextMenuItem onSelect={() => onExpand(node.id)}>
					<Plus aria-hidden="true" />
					{`Show Next Level (${hiddenChildren})`}
				</ContextMenuItem>
			) : null}
			{edit && draftLink ? (
				<>
					<ContextMenuSeparator />
					{draftLink.isRemoved ? (
						<ContextMenuItem
							onSelect={() => edit.onRestore(node.id)}
						>
							<Undo2 aria-hidden="true" />
							Undo Removal
						</ContextMenuItem>
					) : (
						<>
							<ContextMenuItem
								onSelect={() => edit.onEditLink(node.id)}
							>
								<Pencil aria-hidden="true" />
								Edit Link
							</ContextMenuItem>
							<ContextMenuItem
								variant="destructive"
								onSelect={() => edit.onRemove(node.id)}
							>
								<Trash2 aria-hidden="true" />
								Remove Dependency
							</ContextMenuItem>
						</>
					)}
				</>
			) : null}
			{hasItemActions ? <ContextMenuSeparator /> : null}
			{isRequestable ? (
				<ContextMenuItem onSelect={() => onRequestAccess(node)}>
					<LockKeyhole aria-hidden="true" />
					Request Access
				</ContextMenuItem>
			) : null}
			{catalogPath ? (
				<ContextMenuItem asChild>
					<Link to={catalogPath} target="_blank" rel="noreferrer">
						<ExternalLink aria-hidden="true" />
						Open in Catalog
						<span className="sr-only"> (opens in a new tab)</span>
					</Link>
				</ContextMenuItem>
			) : null}
			{ontologyPath ? (
				<ContextMenuItem asChild>
					<Link to={ontologyPath}>
						<Network aria-hidden="true" />
						View Its Ontology
					</Link>
				</ContextMenuItem>
			) : null}
		</>
	);
};
