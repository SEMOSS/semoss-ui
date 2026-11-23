import {
	ArrowDown,
	ArrowUp,
	ExternalLink,
	Info,
	LockKeyhole,
	Maximize,
	Minus,
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
import { canRequestDependency, TRAVERSE_LABELS } from "./catalog-dependency";
import type { CanvasEditState } from "./catalog-dependency-canvas";
import { getOwnDraftLink } from "./catalog-dependency-draft";
import {
	type CatalogDependencyGraph,
	type CatalogGraphNode,
	type DependencyGraphView,
	getGraphNodePaths,
	getTraversalKey,
	type TraversalKey,
	type TraverseDirection,
} from "./catalog-dependency-graph";

/** The menu's words for each way to traverse. */
/** The icon each way to traverse has in the menu. */
const TRAVERSE_ICONS = {
	UPSTREAM: ArrowUp,
	DOWNSTREAM: ArrowDown,
} as const satisfies Record<TraverseDirection, typeof ArrowUp>;

/** The ways to traverse, in the order the menu offers them. */
const TRAVERSE_DIRECTIONS: readonly TraverseDirection[] = [
	"UPSTREAM",
	"DOWNSTREAM",
];

/** What the menu offers while the owner's links are edited. */
export interface MenuEditActions extends CanvasEditState {
	/** Opens Add Dependency */
	readonly onAdd: () => void;
}

/** Props for {@link CatalogDependencyMenuItems}. */
interface CatalogDependencyMenuItemsProps {
	/** What was right-clicked */
	target: GraphMenuTarget;
	/** The owner's graph */
	graph: CatalogDependencyGraph;
	/** What the canvas shows, for where each item's traversals stand */
	view: DependencyGraphView;
	/** Whether any traversal is shown past the owner's direct links */
	hasTraversals: boolean;
	/** The traversals whose read is running */
	pendingTraversals: ReadonlySet<TraversalKey>;
	/** Opens an item in the drawer */
	onOpenItem: (id: string) => void;
	/** Traverses from an item, upstream or downstream */
	onTraverse: (id: string, direction: TraverseDirection) => void;
	/** Hides a traversal */
	onHide: (id: string, direction: TraverseDirection) => void;
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
 * The Ontology tab's right-click menu. On an item: open its details,
 * traverse upstream (to what it uses) or downstream (to what uses it) in
 * place, or hide a traversal shown, ask for access, or open it in the
 * catalog. A way with nothing more to show is off; one being read says
 * Loading. No counts are shown.
 * On the empty canvas: fit the view, and go back to the direct links. Each
 * action shows only where it applies, so a private item offers only its
 * details. While the owner's links are edited, the empty canvas offers Add
 * Dependency, and a manual link's target Edit Dependency and Remove Dependency (or
 * Undo Removal).
 */
export const CatalogDependencyMenuItems = ({
	target,
	graph,
	view,
	hasTraversals,
	pendingTraversals,
	onOpenItem,
	onTraverse,
	onHide,
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
					disabled={!hasTraversals}
				>
					<Undo2 aria-hidden="true" />
					Show Direct Links Only
				</ContextMenuItem>
			</>
		);
	}

	const placed = view.nodes.find((shown) => shown.id === node.id);
	const { catalogPath } = getGraphNodePaths(graph, node);
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
			<ContextMenuItem onSelect={() => onOpenItem(node.id)}>
				<Info aria-hidden="true" />
				Open Details
			</ContextMenuItem>
			{/* editing shows the direct links only, so nothing is traversed */}
			{/* a private item offers only its details */}
			{edit ||
			!placed ||
			node.id === graph.rootId ||
			(node.isPrivate && node.hiddenCount === undefined)
				? null
				: TRAVERSE_DIRECTIONS.map((direction) => {
						const { show, hide } = TRAVERSE_LABELS[direction];
						const Icon = TRAVERSE_ICONS[direction];
						const state =
							direction === "UPSTREAM"
								? placed.upstream
								: placed.downstream;
						if (state === "SHOWN") {
							return (
								<ContextMenuItem
									key={direction}
									onSelect={() => onHide(node.id, direction)}
								>
									<Minus aria-hidden="true" />
									{hide}
								</ContextMenuItem>
							);
						}
						const isLoading = pendingTraversals.has(
							getTraversalKey(node.id, direction),
						);
						return (
							<ContextMenuItem
								key={direction}
								disabled={state === "NONE" || isLoading}
								onSelect={() => onTraverse(node.id, direction)}
							>
								<Icon aria-hidden="true" />
								{isLoading ? "Loading..." : show}
							</ContextMenuItem>
						);
					})}
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
								Edit Dependency
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
					<Link
						to={catalogPath}
						target="_blank"
						rel="noopener noreferrer"
					>
						<ExternalLink aria-hidden="true" />
						Open in Catalog
						<span className="sr-only"> (opens in a new tab)</span>
					</Link>
				</ContextMenuItem>
			) : null}
		</>
	);
};
