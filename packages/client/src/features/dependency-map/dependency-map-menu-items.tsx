import {
	ArrowDownToLine,
	ArrowUpFromLine,
	Copy,
	ExternalLink,
	Info,
	Maximize,
	MousePointerClick,
	X,
} from "lucide-react";
import { Link } from "react-router";
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	toast,
} from "@semoss/ui/next";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import type { DependencyDirection } from "@/api/dependency-map";
import { getResourcePagePath } from "@/utility/catalog";
import type { GraphMenuTarget } from "./dependency-flow-canvas";
import type { DependencyGraphIndex } from "./dependency-graph";

/** Props for {@link DependencyMapMenuItems}. */
interface DependencyMapMenuItemsProps {
	/** What was right-clicked */
	target: GraphMenuTarget;
	/** The network */
	index: DependencyGraphIndex;
	/** Whether an item or a link is open in the drawer */
	hasSelection: boolean;
	/** Whether an item is traced */
	isTracing: boolean;
	/** Opens an item in the drawer */
	onSelectNode: (id: string) => void;
	/** Opens a link in the drawer */
	onSelectEdge: (id: string) => void;
	/** Centers the canvas on an item and selects it */
	onJump: (id: string) => void;
	/** Traces what an item uses or what uses it */
	onTrace: (id: string, direction: DependencyDirection) => void;
	/** Fits the canvas to the network */
	onFitView: () => void;
	/** Closes the drawer */
	onClearSelection: () => void;
	/** Goes back to the whole network */
	onStopTracing: () => void;
}

/**
 * The Ontology's right-click menu. On an item: open its details, trace what
 * it uses (upstream) or what uses it (downstream), open it in the catalog, or
 * copy its id. On a link: open its details, or go to either end. On the empty
 * canvas: fit the view, close the drawer, or stop tracing. Actions that do
 * not apply are left out, so a deleted item cannot be opened in the catalog.
 */
export const DependencyMapMenuItems = ({
	target,
	index,
	hasSelection,
	isTracing,
	onSelectNode,
	onSelectEdge,
	onJump,
	onTrace,
	onFitView,
	onClearSelection,
	onStopTracing,
}: DependencyMapMenuItemsProps) => {
	if (target.kind === "node") {
		const node = index.nodes.get(target.id);
		if (node) {
			const upstream = index.outgoing.get(node.id)?.length ?? 0;
			const downstream = index.incoming.get(node.id)?.length ?? 0;
			return (
				<>
					<ContextMenuLabel className="truncate" title={node.name}>
						{node.name}
					</ContextMenuLabel>
					<ContextMenuSeparator />
					<ContextMenuItem onSelect={() => onSelectNode(node.id)}>
						<Info aria-hidden="true" />
						Open Details
					</ContextMenuItem>
					<ContextMenuItem
						disabled={upstream === 0}
						onSelect={() => onTrace(node.id, "DEPENDENCIES")}
					>
						<ArrowUpFromLine aria-hidden="true" />
						Trace Upstream
					</ContextMenuItem>
					<ContextMenuItem
						disabled={downstream === 0}
						onSelect={() => onTrace(node.id, "DEPENDENTS")}
					>
						<ArrowDownToLine aria-hidden="true" />
						Trace Downstream
					</ContextMenuItem>
					<ContextMenuSeparator />
					{node.missing ? null : (
						<ContextMenuItem asChild>
							<Link
								to={getResourcePagePath(
									node.kind,
									node.type,
									node.id,
								)}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink aria-hidden="true" />
								Open in Catalog
								<span className="sr-only">
									{" "}
									(opens in a new tab)
								</span>
							</Link>
						</ContextMenuItem>
					)}
					<ContextMenuItem
						onSelect={() =>
							void copyTextToClipboard(node.id, {
								onSuccess: () =>
									toast.success("Copied to clipboard"),
								onError: () => toast.error("Failed to copy"),
							})
						}
					>
						<Copy aria-hidden="true" />
						Copy ID
					</ContextMenuItem>
				</>
			);
		}
	}

	if (target.kind === "edge") {
		const edge = index.edges.get(target.id);
		if (edge) {
			const source = index.nodes.get(edge.source);
			const dependency = index.nodes.get(edge.target);
			return (
				<>
					<ContextMenuItem onSelect={() => onSelectEdge(edge.id)}>
						<Info aria-hidden="true" />
						Open Link Details
					</ContextMenuItem>
					<ContextMenuSeparator />
					{source ? (
						<ContextMenuItem onSelect={() => onJump(source.id)}>
							<MousePointerClick aria-hidden="true" />
							<span className="truncate">{`Go to ${source.name}`}</span>
						</ContextMenuItem>
					) : null}
					{dependency ? (
						<ContextMenuItem onSelect={() => onJump(dependency.id)}>
							<MousePointerClick aria-hidden="true" />
							<span className="truncate">{`Go to ${dependency.name}`}</span>
						</ContextMenuItem>
					) : null}
				</>
			);
		}
	}

	return (
		<>
			<ContextMenuItem onSelect={onFitView}>
				<Maximize aria-hidden="true" />
				Fit View
			</ContextMenuItem>
			<ContextMenuItem
				disabled={!hasSelection}
				onSelect={onClearSelection}
			>
				<X aria-hidden="true" />
				Close Details
			</ContextMenuItem>
			<ContextMenuItem disabled={!isTracing} onSelect={onStopTracing}>
				<X aria-hidden="true" />
				Stop Tracing
			</ContextMenuItem>
		</>
	);
};
