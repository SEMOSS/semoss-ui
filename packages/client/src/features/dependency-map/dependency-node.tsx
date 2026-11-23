import {
	Handle,
	type Node,
	type NodeProps,
	Position,
	type ReactFlowState,
	useStore,
} from "@xyflow/react";
import { type LucideIcon, Pencil } from "lucide-react";
import { memo } from "react";
import { Badge, cn } from "@semoss/ui/next";
import type { DependencyGraphNode } from "@/api/dependency-map";
import { getDependencyTypeConfig } from "@/features/catalog/dependencies/catalog-dependency";
import {
	DEPENDENCY_FAMILIES,
	getDependencyFamily,
	type NodeEmphasis,
} from "./dependency-graph";
import { MapTooltip } from "./map-tooltip";

/** A short status a node shows as its one badge, such as an access level. */
export interface DependencyNodeStatus {
	/** The words; never colour alone */
	readonly label: string;
	/** How strongly the badge reads */
	readonly variant: "secondary" | "outline";
	/** An icon before the words */
	readonly icon?: LucideIcon;
}

/** What the canvas hands each node. */
export interface DependencyNodeData extends Record<string, unknown> {
	/** The item */
	node: Pick<DependencyGraphNode, "id" | "type" | "name"> & {
		/** Whether the item was deleted */
		missing?: boolean;
	};
	/** How strongly to draw it */
	emphasis: NodeEmphasis;
	/** Its one badge, such as the user's access; Deleted replaces it */
	status?: DependencyNodeStatus;
	/** Words under the name in place of its type, for a node that is no one item */
	caption?: string;
	/** Whether the user cannot see what it is: drawn muted */
	isPrivate?: boolean;
	/**
	 * Opens the item's link for editing, such as a manual dependency's name
	 * and description; drawn as a pencil on the card's corner
	 */
	onEdit?: (id: string) => void;
}

/** A node on the Dependency Map. */
export type DependencyFlowNode = Node<DependencyNodeData, "dependency">;

/** Below this zoom a node drops its type line: its words are hard to read. */
const COMPACT_ZOOM = 0.45;

// a boolean, so a node renders again only when the zoom crosses the threshold
const isCompactSelector = (state: ReactFlowState): boolean =>
	state.transform[2] < COMPACT_ZOOM;

// as the automation canvas does, a state is the card's edge colour; a
// search match and the selection are rings, so they read over any border
const EMPHASIS_CLASS = {
	normal: "",
	dimmed: "opacity-25",
	match: "ring-3 ring-primary/20",
	traced: "outline-primary/30",
	root: "outline-primary/40",
} as const satisfies Record<NodeEmphasis, string>;

// the round control on a card's corner: the pencil
const CORNER_BUTTON_CLASS =
	"nodrag nopan absolute z-10 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// links still attach to the sides, but no port dot is drawn
const PORT_CLASS =
	"size-0! min-h-0! min-w-0! border-0! bg-transparent! opacity-0!";

/**
 * An engine or project on a dependency graph, drawn as the automation canvas
 * draws a step: a card, lightly tinted in the type's
 * colour, a rounded tile with the type's icon in its colour (the item's image
 * is in the drawer), its name, and its catalog type in
 * small capitals (never the subtype, such as H2 or Postgres, which its details
 * give), with at most one badge at the end (Deleted, or its status). It has no
 * border at rest: one shows when it is selected, the root or on a traced path,
 * and a deleted item has a dashed destructive one. Links attach to hidden
 * handles on its sides. A private item is muted. Traversing is in the right-click menu. The card fills
 * the size the canvas gives it. Clicking it opens its details. Memoized, as
 * React Flow recommends for custom nodes, since the admin canvas renders
 * thousands of them.
 */
export const DependencyNode = memo(
	({ data, selected }: NodeProps<DependencyFlowNode>) => {
		const isCompact = useStore(isCompactSelector);
		const {
			node,
			emphasis,
			status,
			isPrivate = false,
			onEdit,
			caption,
		} = data;
		const family = DEPENDENCY_FAMILIES[getDependencyFamily(node.type)];
		const typeConfig = getDependencyTypeConfig(node.type);
		const TypeIcon = typeConfig.icon;
		const StatusIcon = status?.icon;
		const badge = node.missing ? (
			<Badge variant="destructive">Deleted</Badge>
		) : status ? (
			<Badge variant={status.variant} className="gap-1">
				{StatusIcon ? (
					<StatusIcon className="size-3" aria-hidden="true" />
				) : null}
				{status.label}
			</Badge>
		) : null;

		return (
			<div
				className={cn(
					// no edge at rest; a state draws one as an outline inset over the
					// card's rim, so nothing shows around the tint and the size never shifts
					"group -outline-offset-2 relative flex size-full cursor-pointer rounded-2xl bg-card shadow-sm outline-2 outline-transparent transition-opacity",
					node.missing && "outline-dashed outline-destructive",
					EMPHASIS_CLASS[emphasis],
					// selected: the library's 3px focus halo, in the blue DESIGN.md
					// keeps for selection
					selected && "outline-primary ring-3 ring-primary/20",
				)}
			>
				<div
					className={cn(
						"flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 text-card-foreground",
						// a light tint of the type's colour, over the card so links never show through
						isPrivate || node.missing
							? "bg-muted"
							: family.tintClass,
					)}
				>
					<span
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-xl",
							isPrivate || node.missing
								? "bg-muted"
								: family.tintClass,
						)}
					>
						{/* the type's icon in its colour; the item's image is in the drawer */}
						<TypeIcon
							className={cn(
								"size-4.5",
								isPrivate || node.missing
									? "text-muted-foreground"
									: family.textClass,
							)}
							aria-hidden="true"
						/>
					</span>
					<div className="flex min-w-0 flex-1 flex-col">
						<span
							className={cn(
								"truncate font-medium text-sm leading-snug",
								isPrivate && "text-muted-foreground",
							)}
						>
							{node.name}
						</span>
						{isCompact ? null : (
							// the badge sits beside the type, so the name keeps the width
							<span className="mt-0.5 flex min-w-0 items-center gap-2">
								<span className="truncate text-muted-foreground text-xs uppercase tracking-wide">
									{caption ?? typeConfig.label}
								</span>
								{badge ? (
									<span className="ml-auto shrink-0">
										{badge}
									</span>
								) : null}
							</span>
						)}
					</div>
					{badge && isCompact ? (
						<div className="ml-auto shrink-0">{badge}</div>
					) : null}
				</div>
				{onEdit ? (
					<MapTooltip label={`Edit ${node.name}`}>
						<button
							type="button"
							aria-label={`Edit ${node.name}`}
							onClick={(event) => {
								// editing is not selecting the node
								event.stopPropagation();
								onEdit(node.id);
							}}
							className={cn(
								CORNER_BUTTON_CLASS,
								"-right-2.5 -top-2.5",
							)}
						>
							<Pencil className="size-3" aria-hidden="true" />
						</button>
					</MapTooltip>
				) : null}
				<Handle
					type="target"
					position={Position.Left}
					isConnectable={false}
					className={PORT_CLASS}
				/>
				<Handle
					type="source"
					position={Position.Right}
					isConnectable={false}
					className={PORT_CLASS}
				/>
			</div>
		);
	},
);
DependencyNode.displayName = "DependencyNode";
