import { Panel, type ReactFlowInstance } from "@xyflow/react";
import { FilterX, RefreshCcwDot, RefreshCw, Workflow } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	cn,
	Muted,
	P,
	Skeleton,
	useIsMobile,
} from "@semoss/ui/next";
import type { DependencyDirection } from "@/api/dependency-map";
import type { DependencyFlowEdge } from "./dependency-edge";
import {
	countFamilies,
	type DependencyFamily,
	type DependencyMapLens,
	getMapEmphasis,
	searchNodes,
} from "./dependency-graph";
import { DependencyMapCanvas } from "./dependency-map-canvas";
import { DependencyMapDrawer } from "./dependency-map-drawer";
import { DependencyMapLegend } from "./dependency-map-legend";
import { DependencyMapMenuItems } from "./dependency-map-menu-items";
import { DependencyMapToolbar } from "./dependency-map-toolbar";
import { DependencyMapViewBar } from "./dependency-map-view-bar";
import type { DependencyFlowNode } from "./dependency-node";
import { DependencySyncDialog } from "./dependency-sync-dialog";
import { ExpandedCanvasDialog } from "./expanded-canvas-dialog";
import { focusCanvasItem } from "./focus-canvas-item";
import { MapOverlayCard } from "./map-overlay-card";
import { useDependencyGraph } from "./use-dependency-graph";
import { useDependencyMapView } from "./use-dependency-map-view";
import { useExpandableCanvas } from "./use-expandable-canvas";
import { useUserCatalogAccess } from "./use-user-catalog-access";

// design-lint-disable-next-line arbitrary-size -- the map fills the viewport below the Settings header
const MAP_HEIGHT_CLASS = "h-[calc(100dvh-14rem)] min-h-96";

/** Above this many items the map opens with a hint to search or trace. */
const LARGE_GRAPH = 1500;

/**
 * The Dependency Map: every engine and project on the platform and how they
 * depend on each other, on a canvas the backend lays out. Admins search it,
 * filter it, trace what an item uses and what uses it, see what one user can
 * reach, open an item's details beside the canvas, and sync the automatic
 * dependencies. Expand shows the whole map, drawer included, in the window.
 */
export const DependencyMap = () => {
	const isMobile = useIsMobile();
	const { view, setView, clearFilters, stopTracing } = useDependencyMapView();
	const flowRef = useRef<ReactFlowInstance<
		DependencyFlowNode,
		DependencyFlowEdge
	> | null>(null);
	const [isSyncOpen, setIsSyncOpen] = useState(false);
	const [userName, setUserName] = useState("");
	// the canvas remounts when the map expands or collapses, keeping its place
	const {
		isExpanded,
		startViewport,
		toggle: handleToggleExpand,
		collapse,
	} = useExpandableCanvas(flowRef);

	const isTracing = view.lens === "trace" && view.traceRootId !== "";
	const scope =
		isTracing && view.tracedOnly
			? {
					catalogId: view.traceRootId,
					direction: view.direction,
					depth: view.depth,
				}
			: null;
	const { index, isLoading, isRefreshing, error, refresh } =
		useDependencyGraph(scope);
	const userAccess = useUserCatalogAccess(
		view.lens === "access" ? view.userId : "",
	);
	const access = view.lens === "access" ? userAccess.access : null;
	const hasSelection = view.selectedId !== "" || view.selectedEdgeId !== "";

	// the filters and the legend both count the types
	const familyCounts = useMemo(
		() =>
			index ? countFamilies(index) : new Map<DependencyFamily, number>(),
		[index],
	);

	const matches = useMemo(
		() => (index ? searchNodes(index, view.query) : []),
		[index, view.query],
	);

	const lens = useMemo((): DependencyMapLens => {
		if (isTracing) {
			return {
				kind: "trace",
				rootId: view.traceRootId,
				direction: view.direction,
				depth: view.depth,
			};
		}
		if (view.lens === "access") {
			return { kind: "access", access, showGaps: view.showGaps };
		}
		return { kind: "none" };
	}, [
		isTracing,
		view.traceRootId,
		view.direction,
		view.depth,
		view.lens,
		view.showGaps,
		access,
	]);

	// recomputed for every node and edge, so only when an input changes
	const emphasis = useMemo(
		() =>
			index
				? getMapEmphasis(
						index,
						{ families: view.families, links: view.links },
						lens,
						new Set(matches),
					)
				: null,
		[index, view.families, view.links, lens, matches],
	);

	const shownCount = useMemo(() => {
		if (!emphasis) {
			return 0;
		}
		let count = 0;
		for (const value of emphasis.nodes.values()) {
			if (value !== "dimmed") {
				count++;
			}
		}
		return count;
	}, [emphasis]);

	const handleClearSelection = (): void =>
		setView({ selectedId: "", selectedEdgeId: "" });

	const handleJump = (id: string): void => {
		const node = index?.nodes.get(id);
		if (!node || !index) {
			return;
		}
		const { width, height } = index.graph.nodeSize;
		void flowRef.current?.setCenter(
			node.x + width / 2,
			node.y + height / 2,
			{ zoom: 1, duration: 400 },
		);
		setView({ selectedId: id, selectedEdgeId: "" });
	};

	const handleSelectNode = (id: string): void => {
		// in Trace with nothing traced yet, the item clicked is the one traced
		const isPickingTraceRoot =
			view.lens === "trace" && view.traceRootId === "";
		setView(
			isPickingTraceRoot
				? { traceRootId: id, selectedId: id, selectedEdgeId: "" }
				: { selectedId: id, selectedEdgeId: "" },
		);
	};

	const handleSelectEdge = (id: string): void =>
		setView({ selectedEdgeId: id });

	const handleTrace = (id: string, direction: DependencyDirection): void =>
		setView({
			lens: "trace",
			traceRootId: id,
			direction,
			selectedId: id,
			selectedEdgeId: "",
		});

	// Escape closes the drawer first. React bubbles keys out of portals, so a
	// menu or popover open over the map closes on its own Escape instead
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		const isFromMap =
			event.target instanceof Node &&
			event.currentTarget.contains(event.target);
		if (event.key === "Escape" && hasSelection && isFromMap) {
			event.preventDefault();
			const openId = view.selectedEdgeId || view.selectedId;
			handleClearSelection();
			requestAnimationFrame(() => focusCanvasItem(openId));
		}
	};

	const isFiltered =
		view.query !== "" || view.families !== null || view.links !== "ALL";

	let canvasArea: ReactNode;
	if (!index && isLoading) {
		canvasArea = (
			<Skeleton
				className="size-full rounded-none"
				aria-label="Loading the ontology"
			/>
		);
	} else if (!index) {
		canvasArea = (
			<div className="p-4">
				<Alert variant="destructive">
					<AlertTitle>The ontology could not be read</AlertTitle>
					<AlertDescription className="flex flex-col items-start gap-2">
						{error ?? "Try again."}
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={refresh}
						>
							<RefreshCw aria-hidden="true" />
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			</div>
		);
	} else if (index.nodes.size === 0) {
		canvasArea = (
			<div className="flex size-full flex-col items-center justify-center gap-2 p-10 text-center">
				<Workflow
					className="size-8 text-muted-foreground"
					aria-hidden="true"
				/>
				<P className="font-medium">No engines or projects yet</P>
				<Muted>Items appear here once they are created.</Muted>
			</div>
		);
	} else if (emphasis) {
		let notice: ReactNode = null;
		if (index.edges.size === 0 && view.lens === "none") {
			notice = (
				<MapOverlayCard className="flex flex-col items-center gap-2 p-4 text-center">
					<P className="font-medium text-sm">
						No dependencies recorded yet
					</P>
					<Muted>
						Sync to work them out from every item's configuration.
					</Muted>
					<Button
						type="button"
						size="sm"
						onClick={() => setIsSyncOpen(true)}
					>
						<RefreshCcwDot aria-hidden="true" />
						Sync
					</Button>
				</MapOverlayCard>
			);
		} else if (isFiltered && shownCount === 0) {
			notice = (
				<MapOverlayCard className="flex flex-col items-center gap-2 p-4 text-center">
					<P className="font-medium text-sm">Nothing matches</P>
					<Muted>Everything in the ontology is dimmed.</Muted>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={clearFilters}
					>
						<FilterX aria-hidden="true" />
						Clear Search and Filters
					</Button>
				</MapOverlayCard>
			);
		} else if (
			index.graph.nodes.length > LARGE_GRAPH &&
			view.lens === "none" &&
			!isFiltered &&
			!hasSelection
		) {
			notice = (
				<MapOverlayCard className="px-3 py-1">
					<Muted>
						{index.graph.nodes.length.toLocaleString()} items.
						Search, or trace an item, to focus.
					</Muted>
				</MapOverlayCard>
			);
		}
		canvasArea = (
			<DependencyMapCanvas
				index={index}
				emphasis={emphasis}
				access={access}
				selectedId={view.selectedId}
				selectedEdgeId={view.selectedEdgeId}
				onSelectNode={handleSelectNode}
				onSelectEdge={handleSelectEdge}
				onClearSelection={handleClearSelection}
				onInit={(instance) => {
					flowRef.current = instance;
				}}
				defaultViewport={startViewport}
				renderMenu={(target) => (
					<DependencyMapMenuItems
						target={target}
						index={index}
						hasSelection={hasSelection}
						isTracing={isTracing}
						onSelectNode={handleSelectNode}
						onSelectEdge={handleSelectEdge}
						onJump={handleJump}
						onTrace={handleTrace}
						onFitView={() =>
							void flowRef.current?.fitView({
								padding: 0.1,
								duration: 300,
							})
						}
						onClearSelection={handleClearSelection}
						onStopTracing={stopTracing}
					/>
				)}
			>
				{view.lens === "none" ? null : (
					<Panel position="top-left">
						<DependencyMapViewBar
							index={index}
							view={view}
							onViewChange={setView}
							onStopTracing={stopTracing}
							userName={userName}
							onUserNameChange={setUserName}
							access={access}
							isAccessLoading={userAccess.isLoading}
							accessError={
								view.lens === "access" ? userAccess.error : null
							}
						/>
					</Panel>
				)}
				<Panel position="top-right">
					<DependencyMapLegend
						familyCounts={familyCounts}
						families={view.families}
						isShowingGaps={view.lens === "access" && view.showGaps}
					/>
				</Panel>
				{notice ? <Panel position="top-center">{notice}</Panel> : null}
			</DependencyMapCanvas>
		);
	}

	// on a phone the drawer takes the canvas's place until it is closed
	const isDrawerShown = index !== null && hasSelection;
	const isCanvasShown = !(isMobile && isDrawerShown);

	const mapArea = (
		// biome-ignore lint/a11y/noStaticElementInteractions: Escape here only closes the drawer; the drawer's Close button does the same
		<div
			className={cn(
				"flex min-h-0 flex-col gap-2",
				isExpanded ? "size-full" : MAP_HEIGHT_CLASS,
			)}
			onKeyDown={handleKeyDown}
		>
			{index ? (
				<DependencyMapToolbar
					familyCounts={familyCounts}
					view={view}
					onViewChange={setView}
					onClearFilters={clearFilters}
					matches={matches}
					onJump={handleJump}
					isRefreshing={isRefreshing}
					onRefresh={refresh}
					onSync={() => setIsSyncOpen(true)}
					isExpanded={isExpanded}
					onToggleExpand={handleToggleExpand}
				/>
			) : null}
			{index && error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			<div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
				{isCanvasShown ? (
					<div className="relative min-w-0 flex-1">{canvasArea}</div>
				) : null}
				{isDrawerShown && index ? (
					<div
						className={cn("shrink-0", isMobile ? "w-full" : "w-md")}
					>
						<DependencyMapDrawer
							index={index}
							selectedId={view.selectedId}
							selectedEdgeId={view.selectedEdgeId}
							access={access}
							onClose={handleClearSelection}
							onTrace={handleTrace}
							onJump={handleJump}
							onSelectEdge={handleSelectEdge}
						/>
					</div>
				) : null}
			</div>
		</div>
	);

	return (
		<>
			{isExpanded ? (
				<ExpandedCanvasDialog
					title="Ontology"
					placeholderClassName={MAP_HEIGHT_CLASS}
					onEscape={() => {
						// Escape closes the drawer before it collapses the map
						if (!hasSelection) {
							return false;
						}
						handleClearSelection();
						return true;
					}}
					onCollapse={collapse}
				>
					{mapArea}
				</ExpandedCanvasDialog>
			) : (
				mapArea
			)}
			<DependencySyncDialog
				open={isSyncOpen}
				onOpenChange={setIsSyncOpen}
				index={index}
				onSynced={refresh}
				onJump={handleJump}
			/>
		</>
	);
};
