import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	type ReactFlowState,
	useStore,
} from "@xyflow/react";
import { memo } from "react";
import { Badge, cn } from "@semoss/ui/next";
import type {
	DependencyGraphNode,
	UserCatalogAccess,
} from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import {
	ACCESS_LEVEL_LABELS,
	DEPENDENCY_FAMILIES,
	getDependencyFamily,
	type NodeEmphasis,
} from "./dependency-graph";
import { DependencyItemImage } from "./dependency-item-image";

/** What the canvas hands each node. */
export interface DependencyNodeData extends Record<string, unknown> {
	/** The item */
	node: DependencyGraphNode;
	/** How strongly to draw it */
	emphasis: NodeEmphasis;
	/** The picked user's access; null for none, undefined when that view is off */
	access?: UserCatalogAccess | null;
}

/** A node on the Dependency Map. */
export type DependencyFlowNode = Node<DependencyNodeData, "dependency">;

/** Below this zoom a node drops its image: its words are hard to read. */
const COMPACT_ZOOM = 0.45;

// a boolean, so a node renders again only when the zoom crosses the threshold
const isCompactSelector = (state: ReactFlowState): boolean =>
	state.transform[2] < COMPACT_ZOOM;

const EMPHASIS_CLASS = {
	normal: "",
	dimmed: "opacity-25",
	match: "ring-2 ring-primary",
	traced: "border-primary/60",
	root: "border-primary ring-2 ring-primary",
} as const satisfies Record<NodeEmphasis, string>;

/**
 * An engine or project on the map: its type's colour, image, name and type.
 * At most one badge: Deleted, or the picked user's access in User Access.
 * Clicking it opens the drawer with everything else. Memoized, as React Flow
 * recommends for custom nodes, since the canvas renders thousands of them.
 */
export const DependencyNode = memo(
	({ data, selected }: NodeProps<DependencyFlowNode>) => {
		const isCompact = useStore(isCompactSelector);
		const { node, emphasis, access } = data;
		const family = DEPENDENCY_FAMILIES[getDependencyFamily(node.type)];
		const typeConfig = getDependencyTypeConfig(node.type);
		const TypeIcon = typeConfig.icon;
		const badge = node.missing ? (
			<Badge variant="destructive">Deleted</Badge>
		) : access === null ? (
			<Badge variant="outline">No access</Badge>
		) : access ? (
			<Badge variant="secondary">
				{ACCESS_LEVEL_LABELS[access.permission]}
			</Badge>
		) : null;

		return (
			<div
				className={cn(
					"relative flex h-16 w-60 cursor-pointer items-center gap-2 overflow-hidden rounded-lg border bg-card pr-2 pl-3 text-card-foreground shadow-sm transition-opacity",
					node.missing && "border-destructive border-dashed",
					EMPHASIS_CLASS[emphasis],
					selected && "ring-2 ring-ring",
				)}
			>
				<span
					aria-hidden="true"
					className={cn(
						"absolute inset-y-0 left-0 w-1",
						node.missing ? "bg-destructive" : family.swatchClass,
					)}
				/>
				{isCompact ? (
					<TypeIcon
						className={cn("size-6 shrink-0", family.textClass)}
						aria-hidden="true"
					/>
				) : (
					<DependencyItemImage node={node} className="size-8" />
				)}
				<div className="flex min-w-0 flex-1 flex-col">
					<span className="truncate font-medium text-sm">
						{node.name}
					</span>
					{isCompact ? null : (
						<span className="flex min-w-0 items-center gap-1 text-muted-foreground text-xs">
							<TypeIcon
								className={cn(
									"size-3 shrink-0",
									family.textClass,
								)}
								aria-hidden="true"
							/>
							<span className="truncate">
								{typeConfig.label}
								{node.subtype ? ` · ${node.subtype}` : ""}
							</span>
						</span>
					)}
				</div>
				{badge ? <div className="shrink-0">{badge}</div> : null}
				<Handle
					type="target"
					position={Position.Left}
					isConnectable={false}
					className="invisible"
				/>
				<Handle
					type="source"
					position={Position.Right}
					isConnectable={false}
					className="invisible"
				/>
			</div>
		);
	},
);
DependencyNode.displayName = "DependencyNode";
