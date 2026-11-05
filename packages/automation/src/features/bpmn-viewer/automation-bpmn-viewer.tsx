import BpmnModeler from "bpmn-js/lib/Modeler";
import { Scan, ZoomIn, ZoomOut } from "lucide-react";
import {
	type Ref,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { CANVAS_GRID_SIZE } from "../canvas-helper-lines/helper-lines";

import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "@semoss/ui/next";
import type {
	AutomationEdge,
	AutomationNode,
} from "../../domain/automation.types";
import { getAutomationNodeDefinition } from "../../domain/automation-node-catalog";
import type {
	AutomationNodeGroup,
	AutomationWorkflowNodeType,
} from "../../domain/automation-workflow.types";
import { createCanvasWorkflowNode } from "../../domain/automation-workflow-adapter";
import {
	automationPaletteModule,
	PALETTE_RESERVED_HEIGHT,
} from "./automation-palette-provider";
import { automationToBpmnXml, computeBpmnOffsets } from "./automation-to-bpmn";
import { AUTOMATION_NODE_TYPE_BY_BPMN } from "./bpmn-node-mapping";

/** Imperative handle exposed to the parent via ref. */
export interface BpmnEditorHandle {
	/** Saves and downloads the current diagram as a .bpmn file. */
	exportBpmn(): Promise<void>;
	/** Returns the current diagram XML (for convert-to-automation flows). */
	getXml(): Promise<string | null>;
}

interface AutomationBpmnEditorProps {
	nodes: AutomationNode[];
	edges: AutomationEdge[];
	processName: string;
	sourceXml?: string;
	sourceName?: string;
	/** Called with the editor's current XML when the user confirms import. */
	onConvertToAutomation?: (xml: string) => void;
	onCancelImport?: () => void;
	isConverting?: boolean;
	/** Fires true when the diagram is first edited, false when a fresh diagram loads. */
	onDirtyChange?: (isDirty: boolean) => void;
	/** Event bridge: fires when the user adds/removes nodes, edges, or groups in the BPMN editor. */
	onNodeAdded?: (node: AutomationNode) => void;
	onNodeRemoved?: (nodeId: string) => void;
	onEdgeAdded?: (edge: AutomationEdge) => void;
	onEdgeRemoved?: (edgeId: string) => void;
	onNodeLabelChanged?: (nodeId: string, label: string) => void;
	/** Lane added/removed → automation node group added/removed. */
	onGroupAdded?: (group: AutomationNodeGroup) => void;
	onGroupRemoved?: (groupId: string) => void;
	/** Fires when a node is moved in the BPMN editor with updated automation-space position. */
	onNodeMoved?: (nodeId: string, position: { x: number; y: number }) => void;
	/** SubProcess body bridge — fires when children of a loop SubProcess are added/removed. */
	onBodyNodeAdded?: (loopId: string, node: AutomationNode) => void;
	onBodyNodeRemoved?: (loopId: string, nodeId: string) => void;
	onBodyEdgeAdded?: (loopId: string, edge: AutomationEdge) => void;
	onBodyEdgeRemoved?: (loopId: string, edgeId: string) => void;
	/** Fired when the user selects or deselects a BPMN element. nodeId is null on deselect. */
	onNodeSelected?: (nodeId: string | null) => void;
	ref?: Ref<BpmnEditorHandle>;
}

/** Loose shape/connection type as exposed by bpmn-js internal events. */
interface BpmnShape {
	id: string;
	type: string;
	x: number;
	y: number;
	width: number;
	height: number;
	businessObject?: { name?: string };
	/** Automation node type set by the palette on shapes it creates. */
	semossType?: string;
	/** Parent element — bpmn-js always sets this at runtime. */
	parent?: { type?: string; id?: string };
}

interface BpmnConnection {
	id: string;
	type: string;
	source: { id: string; parent?: { type?: string; id?: string } };
	target: { id: string };
	parent?: { type?: string; id?: string };
}

type EventCallbackRefs = {
	onNodeAdded: { current: ((node: AutomationNode) => void) | undefined };
	onNodeRemoved: { current: ((id: string) => void) | undefined };
	onEdgeAdded: { current: ((edge: AutomationEdge) => void) | undefined };
	onEdgeRemoved: { current: ((id: string) => void) | undefined };
	onNodeLabelChanged: {
		current: ((id: string, label: string) => void) | undefined;
	};
	onGroupAdded: {
		current: ((group: AutomationNodeGroup) => void) | undefined;
	};
	onGroupRemoved: { current: ((groupId: string) => void) | undefined };
	onNodeMoved: {
		current:
			| ((id: string, position: { x: number; y: number }) => void)
			| undefined;
	};
	onBodyNodeAdded: {
		current: ((loopId: string, node: AutomationNode) => void) | undefined;
	};
	onBodyNodeRemoved: {
		current: ((loopId: string, nodeId: string) => void) | undefined;
	};
	onBodyEdgeAdded: {
		current: ((loopId: string, edge: AutomationEdge) => void) | undefined;
	};
	onBodyEdgeRemoved: {
		current: ((loopId: string, edgeId: string) => void) | undefined;
	};
	onNodeSelected: { current: ((nodeId: string | null) => void) | undefined };
	offsetX: { current: number };
	offsetY: { current: number };
};

// Lane is handled separately as a node group, not skipped.
const SKIP_SHAPE_TYPES = new Set([
	"bpmn:EndEvent",
	"label",
	"bpmn:Participant",
	"bpmn:DataStoreReference",
	"bpmn:DataObjectReference",
	"bpmn:DataObject",
]);

function shapeToAutomationNode(element: BpmnShape): AutomationNode {
	// Shapes from the automation palette carry their exact node type; anything
	// else (stock bpmn-js shapes, replaced elements) falls back to a guess from
	// the BPMN element type.
	const workflowType =
		(element.semossType && getAutomationNodeDefinition(element.semossType)
			? (element.semossType as AutomationWorkflowNodeType)
			: undefined) ??
		AUTOMATION_NODE_TYPE_BY_BPMN[element.type] ??
		"developer.python";
	const node = createCanvasWorkflowNode(workflowType, 0);
	node.id = element.id;
	node.label =
		element.businessObject?.name?.trim() ||
		element.type.replace("bpmn:", "");
	node.position = { x: element.x, y: element.y };
	return node;
}

// bpmn-js types its event listeners as () => void but the runtime always
// passes an event object — cast the `on` method to bypass the incorrect typing.
type BpmnListener = (event: unknown) => void;
type BpmnOn = (event: string, listener: BpmnListener) => void;

/** Id of the SubProcess (loop) a connection lives in, if any. */
function getSubProcessParentId(connection: BpmnConnection): string | undefined {
	if (connection.parent?.type === "bpmn:SubProcess") {
		return connection.parent.id;
	}
	return connection.source.parent?.type === "bpmn:SubProcess"
		? connection.source.parent.id
		: undefined;
}

function wireEventBridge(modeler: BpmnModeler, refs: EventCallbackRefs): void {
	const on = modeler.on.bind(modeler) as BpmnOn;
	on("shape.added", (({ element }: { element: BpmnShape }) => {
		// bpmn-js auto-inserts a StartEvent (and sometimes EndEvent) inside every
		// new SubProcess as internal structure — skip those, but allow any other
		// shapes the user manually places inside a SubProcess to flow through.
		if (
			element.parent?.type === "bpmn:SubProcess" &&
			(element.type === "bpmn:StartEvent" ||
				element.type === "bpmn:EndEvent")
		)
			return;
		if (element.type === "bpmn:Lane") {
			const group: AutomationNodeGroup = {
				id: element.id,
				name:
					element.businessObject?.name?.trim() ||
					element.type.replace("bpmn:", ""),
				nodeIds: [],
			};
			refs.onGroupAdded.current?.(group);
			return;
		}
		if (SKIP_SHAPE_TYPES.has(element.type)) return;
		// Route children of a SubProcess (loop) to the body callbacks.
		if (element.parent?.type === "bpmn:SubProcess" && element.parent.id) {
			refs.onBodyNodeAdded.current?.(
				element.parent.id,
				shapeToAutomationNode(element),
			);
			return;
		}
		refs.onNodeAdded.current?.(shapeToAutomationNode(element));
	}) as BpmnListener);

	on("shape.removed", (({ element }: { element: BpmnShape }) => {
		if (
			element.parent?.type === "bpmn:SubProcess" &&
			(element.type === "bpmn:StartEvent" ||
				element.type === "bpmn:EndEvent")
		)
			return;
		if (element.type === "bpmn:Lane") {
			refs.onGroupRemoved.current?.(element.id);
			return;
		}
		if (SKIP_SHAPE_TYPES.has(element.type)) return;
		if (element.parent?.type === "bpmn:SubProcess" && element.parent.id) {
			refs.onBodyNodeRemoved.current?.(element.parent.id, element.id);
			return;
		}
		refs.onNodeRemoved.current?.(element.id);
	}) as BpmnListener);

	on("connection.added", (({ element }: { element: BpmnConnection }) => {
		if (element.type !== "bpmn:SequenceFlow") return;
		const edge: AutomationEdge = {
			id: element.id,
			source: element.source.id,
			target: element.target.id,
			kind: "control",
		};
		// Route connections inside a SubProcess to body edge callbacks.
		const parentId = getSubProcessParentId(element);
		if (parentId) {
			refs.onBodyEdgeAdded.current?.(parentId, edge);
			return;
		}
		refs.onEdgeAdded.current?.(edge);
	}) as BpmnListener);

	on("connection.removed", (({ element }: { element: BpmnConnection }) => {
		if (element.type !== "bpmn:SequenceFlow") return;
		const parentId = getSubProcessParentId(element);
		if (parentId) {
			refs.onBodyEdgeRemoved.current?.(parentId, element.id);
			return;
		}
		refs.onEdgeRemoved.current?.(element.id);
	}) as BpmnListener);

	// Reconnecting mutates a connection in place, so no connection.added or
	// connection.removed fires. This covers dragging an endpoint and the
	// "change element" replace, which re-points existing flows at the new shape
	// before the old shape (and its edges) is removed. Re-sync the edge so it
	// follows the new endpoint instead of being dropped with the old node.
	on("commandStack.connection.reconnect.postExecuted", (({
		context,
	}: {
		context: { connection: BpmnConnection };
	}) => {
		const { connection } = context;
		if (connection.type !== "bpmn:SequenceFlow") return;
		const edge: AutomationEdge = {
			id: connection.id,
			source: connection.source.id,
			target: connection.target.id,
			kind: "control",
		};
		const parentId = getSubProcessParentId(connection);
		if (parentId) {
			refs.onBodyEdgeRemoved.current?.(parentId, edge.id);
			refs.onBodyEdgeAdded.current?.(parentId, edge);
			return;
		}
		refs.onEdgeRemoved.current?.(edge.id);
		refs.onEdgeAdded.current?.(edge);
	}) as BpmnListener);

	on("shape.move.end", (({ context }: { context: { shape: BpmnShape } }) => {
		const element = context.shape;
		if (SKIP_SHAPE_TYPES.has(element.type) || element.type === "bpmn:Lane")
			return;
		// Reverse the nodeBounds centering + global offset to get automation coords.
		const position = {
			x: element.x - (280 - element.width) / 2 - refs.offsetX.current,
			y: element.y - (120 - element.height) / 2 - refs.offsetY.current,
		};
		refs.onNodeMoved.current?.(element.id, position);
	}) as BpmnListener);

	on("element.changed", (({ element }: { element: BpmnShape }) => {
		const label = element.businessObject?.name?.trim() ?? "";
		if (!label) return;
		if (element.type === "bpmn:Lane") {
			// Rename the group by re-adding with the updated name; the canvas
			// handler merges by id so this is effectively an update.
			refs.onGroupAdded.current?.({
				id: element.id,
				name: label,
				nodeIds: [],
			});
			return;
		}
		if (SKIP_SHAPE_TYPES.has(element.type)) return;
		refs.onNodeLabelChanged.current?.(element.id, label);
	}) as BpmnListener);

	on("selection.changed", (({
		newSelection,
	}: {
		newSelection: BpmnShape[];
	}) => {
		const first = newSelection?.[0];
		if (!first || SKIP_SHAPE_TYPES.has(first.type)) {
			refs.onNodeSelected.current?.(null);
			return;
		}
		refs.onNodeSelected.current?.(first.id);
	}) as BpmnListener);
}

function fitDiagram(modeler: BpmnModeler): void {
	const canvas = modeler.get("canvas");
	const { outer } = canvas.viewbox();
	canvas.zoom("fit-viewport", {
		x: outer.width / 2,
		y: outer.height / 2,
	});
}

interface GridViewbox {
	x: number;
	y: number;
	scale: number;
}

/**
 * Paints a dotted grid on the canvas container that pans and zooms with the
 * diagram. bpmn-js has no background grid of its own, so the dots are a CSS
 * gradient re-aligned to the viewbox whenever it changes.
 */
function syncGridBackground(
	container: HTMLElement,
	viewbox: GridViewbox,
): void {
	const tile = CANVAS_GRID_SIZE * viewbox.scale;
	container.style.backgroundImage =
		"radial-gradient(circle, color-mix(in srgb, currentColor 35%, transparent) 1px, transparent 1px)";
	container.style.backgroundSize = `${tile}px ${tile}px`;
	// The dot sits at the tile centre, so shift by half a tile to put one on
	// the diagram origin.
	container.style.backgroundPosition = `${-viewbox.x * viewbox.scale - tile / 2}px ${-viewbox.y * viewbox.scale - tile / 2}px`;
}

function triggerDownload(xml: string, fileName: string): void {
	const blob = new Blob([xml], { type: "application/xml" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	URL.revokeObjectURL(url);
}

/** Renders the Automation workflow as a full BPMN editor with export support. */
export function AutomationBpmnEditor({
	nodes,
	edges,
	processName,
	sourceXml,
	sourceName,
	onDirtyChange,
	onNodeAdded,
	onNodeRemoved,
	onEdgeAdded,
	onEdgeRemoved,
	onNodeLabelChanged,
	onGroupAdded,
	onGroupRemoved,
	onNodeMoved,
	onBodyNodeAdded,
	onBodyNodeRemoved,
	onBodyEdgeAdded,
	onBodyEdgeRemoved,
	onNodeSelected,
	ref,
}: AutomationBpmnEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<BpmnModeler | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	// Snapshot nodes/edges/processName at mount so the modeler effect doesn't
	// re-run when the event bridge writes back into the parent's node list.
	// The BPMN modeler owns its own canvas state once initialized.
	const initNodesRef = useRef(nodes);
	const initEdgesRef = useRef(edges);
	const initProcessNameRef = useRef(processName);

	// Stable refs so effects don't re-run when callback identities change.
	const onDirtyChangeRef = useRef(onDirtyChange);
	const onNodeAddedRef = useRef(onNodeAdded);
	const onNodeRemovedRef = useRef(onNodeRemoved);
	const onEdgeAddedRef = useRef(onEdgeAdded);
	const onEdgeRemovedRef = useRef(onEdgeRemoved);
	const onNodeLabelChangedRef = useRef(onNodeLabelChanged);
	const onGroupAddedRef = useRef(onGroupAdded);
	const onGroupRemovedRef = useRef(onGroupRemoved);
	const onNodeMovedRef = useRef(onNodeMoved);
	const onBodyNodeAddedRef = useRef(onBodyNodeAdded);
	const onBodyNodeRemovedRef = useRef(onBodyNodeRemoved);
	const onBodyEdgeAddedRef = useRef(onBodyEdgeAdded);
	const onBodyEdgeRemovedRef = useRef(onBodyEdgeRemoved);
	const onNodeSelectedRef = useRef(onNodeSelected);
	const offsetXRef = useRef(80);
	const offsetYRef = useRef(80);
	useEffect(() => {
		onDirtyChangeRef.current = onDirtyChange;
		onNodeAddedRef.current = onNodeAdded;
		onNodeRemovedRef.current = onNodeRemoved;
		onEdgeAddedRef.current = onEdgeAdded;
		onEdgeRemovedRef.current = onEdgeRemoved;
		onNodeLabelChangedRef.current = onNodeLabelChanged;
		onGroupAddedRef.current = onGroupAdded;
		onGroupRemovedRef.current = onGroupRemoved;
		onNodeMovedRef.current = onNodeMoved;
		onBodyNodeAddedRef.current = onBodyNodeAdded;
		onBodyNodeRemovedRef.current = onBodyNodeRemoved;
		onBodyEdgeAddedRef.current = onBodyEdgeAdded;
		onBodyEdgeRemovedRef.current = onBodyEdgeRemoved;
		onNodeSelectedRef.current = onNodeSelected;
	});

	useImperativeHandle(ref, () => ({
		async exportBpmn() {
			const modeler = modelerRef.current;
			if (!modeler || isExporting) return;
			setIsExporting(true);
			try {
				const { xml } = await modeler.saveXML({ format: true });
				const baseName = sourceName
					? sourceName.replace(/\.[^.]+$/, "")
					: processName.trim() || "automation";
				triggerDownload(xml, `${baseName}.bpmn`);
			} catch {
				// non-critical
			} finally {
				setIsExporting(false);
			}
		},
		async getXml() {
			const modeler = modelerRef.current;
			if (!modeler) return null;
			try {
				const { xml } = await modeler.saveXML({ format: true });
				return xml;
			} catch {
				return null;
			}
		},
	}));

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		onDirtyChangeRef.current?.(false);

		const modeler = new BpmnModeler({
			container,
			gridSnapping: { active: true },
			additionalModules: [automationPaletteModule],
		});
		modelerRef.current = modeler;
		syncGridBackground(
			container,
			modeler.get("canvas").viewbox() as unknown as GridViewbox,
		);
		(modeler.on.bind(modeler) as BpmnOn)(
			"canvas.viewbox.changed",
			((event: { viewbox: GridViewbox }) =>
				syncGridBackground(container, event.viewbox)) as BpmnListener,
		);
		let isDisposed = false;
		setError(null);

		// Compute the BPMN coordinate offset once and store for move reverse-calc.
		if (!sourceXml) {
			const { offsetX, offsetY } = computeBpmnOffsets(
				initNodesRef.current,
			);
			offsetXRef.current = offsetX;
			offsetYRef.current = offsetY;
		}

		const diagramXml = sourceXml
			? Promise.resolve(sourceXml)
			: automationToBpmnXml(
					initNodesRef.current,
					initEdgesRef.current,
					initProcessNameRef.current,
				);

		// Only track dirty state when viewing an imported BPMN file — in live
		// editing mode the automation model is the source of truth, so there's
		// nothing to "lose" on a view switch.
		const onCommandStackChanged = sourceXml
			? () => onDirtyChangeRef.current?.(true)
			: undefined;

		void diagramXml
			.then((xml) => modeler.importXML(xml))
			.then(() => {
				if (isDisposed) return;
				// Subscribe after import so the import itself doesn't mark dirty
				// and the event bridge doesn't replay existing shapes.
				if (onCommandStackChanged) {
					modeler.on("commandStack.changed", onCommandStackChanged);
				}
				wireEventBridge(modeler, {
					onNodeAdded: onNodeAddedRef,
					onNodeRemoved: onNodeRemovedRef,
					onEdgeAdded: onEdgeAddedRef,
					onEdgeRemoved: onEdgeRemovedRef,
					onNodeLabelChanged: onNodeLabelChangedRef,
					onGroupAdded: onGroupAddedRef,
					onGroupRemoved: onGroupRemovedRef,
					onNodeMoved: onNodeMovedRef,
					onBodyNodeAdded: onBodyNodeAddedRef,
					onBodyNodeRemoved: onBodyNodeRemovedRef,
					onBodyEdgeAdded: onBodyEdgeAddedRef,
					onBodyEdgeRemoved: onBodyEdgeRemovedRef,
					onNodeSelected: onNodeSelectedRef,
					offsetX: offsetXRef,
					offsetY: offsetYRef,
				});
				window.requestAnimationFrame(() => {
					if (!isDisposed) fitDiagram(modeler);
				});
			})
			.catch((importError: unknown) => {
				if (!isDisposed) {
					setError(
						importError instanceof Error
							? importError.message
							: "Unknown BPMN rendering error.",
					);
				}
			});

		return () => {
			isDisposed = true;
			modelerRef.current = null;
			modeler.destroy();
		};
	}, [sourceXml]);

	return (
		<section
			aria-label="BPMN workflow editor"
			className="absolute inset-0 z-0 bg-background"
		>
			{/* Hide the group and data object palette entries: groups are not useful here,
			    and data objects have no automation node, so they would not be saved. */}
			{/* On short screens the palette outgrows the canvas, so let it scroll
			    and leave room for the view switcher at the bottom left. The
			    widths add the scrollbar's share to bpmn-js's 94px/47px so the
			    scrollbar does not squeeze the entries into one column. */}
			<style>{`[data-action="create.group"] { display: none !important; }
[data-action="create.data-object"], [data-action="create.data-store"] { display: none !important; }
.djs-palette { max-height: calc(100% - ${PALETTE_RESERVED_HEIGHT}px); overflow-y: auto; scrollbar-width: thin; }
.djs-palette.two-column.open { width: 108px; }
.djs-palette:not(.two-column).open { width: 62px; }`}</style>
			<div
				ref={containerRef}
				className="absolute inset-0 text-muted-foreground"
			/>
			<div className="absolute right-28 bottom-4 z-20 flex items-center overflow-hidden rounded-lg border bg-background shadow-sm">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Zoom out BPMN diagram"
							onClick={() => {
								const canvas =
									modelerRef.current?.get("canvas");
								const zoom = canvas?.zoom();
								if (typeof zoom === "number")
									canvas?.zoom(zoom / 1.2);
							}}
							className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<ZoomOut className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Zoom out</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Zoom in BPMN diagram"
							onClick={() => {
								const canvas =
									modelerRef.current?.get("canvas");
								const zoom = canvas?.zoom();
								if (typeof zoom === "number")
									canvas?.zoom(zoom * 1.2);
							}}
							className="flex size-8 items-center justify-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<ZoomIn className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Zoom in</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							aria-label="Fit BPMN diagram to view"
							onClick={() => {
								const modeler = modelerRef.current;
								if (modeler) fitDiagram(modeler);
							}}
							className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Scan className="size-4" aria-hidden />
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">Fit to view</TooltipContent>
				</Tooltip>
			</div>
			{error && (
				<div
					role="alert"
					className="absolute inset-x-4 bottom-16 z-20 rounded-md border border-destructive/40 bg-background p-3 text-destructive text-sm"
				>
					Could not render BPMN: {error}
				</div>
			)}
		</section>
	);
}

/**
 * Backward-compatible alias — canvas lazy-imports this name.
 * @deprecated Use AutomationBpmnEditor directly.
 */
export { AutomationBpmnEditor as AutomationBpmnViewer };
