import { Panel, type ReactFlowInstance, type Viewport } from "@xyflow/react";
import { FilterX, RefreshCcwDot, RefreshCw, Workflow } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useEffect,
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	Muted,
	Skeleton,
	useIsMobile,
} from "@semoss/ui/next";
import type { DependencyDirection } from "@/api/dependency-map";
import type { DependencyFlowEdge } from "./dependency-edge";
import {
	type DependencyMapLens,
	findAccessGaps,
	getMapEmphasis,
	searchNodes,
	summarizeImpact,
	traceGraph,
} from "./dependency-graph";
import {
	type DependencyMapActions,
	DependencyMapActionsContext,
} from "./dependency-map-actions.context";
import { DependencyMapCanvas } from "./dependency-map-canvas";
import { DependencyMapDrawer } from "./dependency-map-drawer";
import { DependencyMapLegend } from "./dependency-map-legend";
import { DependencyMapToolbar } from "./dependency-map-toolbar";
import { DependencyMapViewBar } from "./dependency-map-view-bar";
import type { DependencyFlowNode } from "./dependency-node";
import { DependencySyncDialog } from "./dependency-sync-dialog";
import { useDependencyGraph } from "./use-dependency-graph";
import { useDependencyMapView } from "./use-dependency-map-view";
import { useUserCatalogAccess } from "./use-user-catalog-access";

// design-lint-disable-next-line arbitrary-size -- the map fills the viewport below the Settings header
const MAP_HEIGHT_CLASS = "h-[calc(100dvh-14rem)] min-h-96";

// design-lint-disable-next-line arbitrary-size -- the expanded map fills the whole window
const EXPANDED_CLASS =
	"h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none border-0 p-4 sm:max-w-none";

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
	const { view, setView, clearFilters } = useDependencyMapView();
	const flowRef = useRef<ReactFlowInstance<
		DependencyFlowNode,
		DependencyFlowEdge
	> | null>(null);
	const [isSyncOpen, setIsSyncOpen] = useState(false);
	const [userName, setUserName] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	// the canvas remounts when the map expands or collapses; it starts here
	const [startViewport, setStartViewport] = useState<Viewport | undefined>();

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

	const impact = useMemo(() => {
		if (!index || !isTracing) {
			return [];
		}
		const trace = traceGraph(
			index,
			view.traceRootId,
			view.direction,
			view.depth,
		);
		return summarizeImpact(index, trace, view.traceRootId);
	}, [index, isTracing, view.traceRootId, view.direction, view.depth]);

	const gapCount = useMemo(
		() => (index && access ? findAccessGaps(index, access).length : null),
		[index, access],
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

	const clearSelection = useCallback(
		() => setView({ selectedId: "", selectedEdgeId: "" }),
		[setView],
	);

	const jumpTo = useCallback(
		(id: string) => {
			const node = index?.nodes.get(id);
			if (!node || !index) {
				return;
			}
			const { width, height } = index.graph.nodeSize;
			void flowRef.current?.setCenter(
				node.x + width / 2,
				node.y + height / 2,
				{
					zoom: 1,
					duration: 400,
				},
			);
			setView({ selectedId: id, selectedEdgeId: "" });
		},
		[index, setView],
	);

	const isPickingTraceRoot = view.lens === "trace" && view.traceRootId === "";
	const actions = useMemo(
		(): DependencyMapActions => ({
			// in Trace with nothing traced yet, the item clicked is the one traced
			selectNode: (id) =>
				setView(
					isPickingTraceRoot
						? {
								traceRootId: id,
								selectedId: id,
								selectedEdgeId: "",
							}
						: { selectedId: id, selectedEdgeId: "" },
				),
			selectEdge: (id) => setView({ selectedEdgeId: id }),
			jumpTo,
			trace: (id: string, direction: DependencyDirection) =>
				setView({
					lens: "trace",
					traceRootId: id,
					direction,
					selectedId: id,
					selectedEdgeId: "",
				}),
		}),
		[isPickingTraceRoot, jumpTo, setView],
	);

	const keepViewport = (): void =>
		setStartViewport(flowRef.current?.getViewport());

	const collapse = useCallback((): void => {
		setStartViewport(flowRef.current?.getViewport());
		setIsExpanded(false);
		if (document.fullscreenElement) {
			void document.exitFullscreen();
		}
	}, []);

	const handleToggleExpand = (): void => {
		if (isExpanded) {
			collapse();
			return;
		}
		keepViewport();
		setIsExpanded(true);
		// take the whole screen too; the window is used when the browser refuses
		document.documentElement.requestFullscreen?.().catch(() => undefined);
	};

	// leaving the browser's full screen, such as with Escape, collapses the map
	useEffect(() => {
		const handleChange = (): void => {
			if (!document.fullscreenElement) {
				setIsExpanded((wasExpanded) => {
					if (wasExpanded) {
						setStartViewport(flowRef.current?.getViewport());
					}
					return false;
				});
			}
		};
		document.addEventListener("fullscreenchange", handleChange);
		return () =>
			document.removeEventListener("fullscreenchange", handleChange);
	}, []);

	// Escape closes the drawer first. React bubbles keys out of portals, so a
	// menu or popover open over the map closes on its own Escape instead
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		const isFromMap =
			event.target instanceof Node &&
			event.currentTarget.contains(event.target);
		if (event.key === "Escape" && hasSelection && isFromMap) {
			event.preventDefault();
			clearSelection();
		}
	};

	const isFiltered =
		view.query !== "" || view.families !== null || view.links !== "ALL";

	let canvasArea: ReactNode;
	if (!index && isLoading) {
		canvasArea = (
			<Skeleton
				className="size-full rounded-none"
				aria-label="Loading the dependency map"
			/>
		);
	} else if (!index) {
		canvasArea = (
			<div className="p-4">
				<Alert variant="destructive">
					<AlertTitle>
						The dependency map could not be read
					</AlertTitle>
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
				<p className="font-medium">No engines or projects yet</p>
				<Muted>Items appear here once they are created.</Muted>
			</div>
		);
	} else if (emphasis) {
		const notice =
			index.edges.size === 0 && view.lens === "none" ? (
				<div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center shadow-sm">
					<p className="font-medium text-sm">
						No dependencies recorded yet
					</p>
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
				</div>
			) : isFiltered && shownCount === 0 ? (
				<div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center shadow-sm">
					<p className="font-medium text-sm">Nothing matches</p>
					<Muted>Everything on the map is dimmed.</Muted>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={clearFilters}
					>
						<FilterX aria-hidden="true" />
						Clear Search and Filters
					</Button>
				</div>
			) : index.graph.nodes.length > LARGE_GRAPH &&
				view.lens === "none" &&
				!isFiltered &&
				!hasSelection ? (
				<Muted className="rounded-md border bg-card px-3 py-1">
					{index.graph.nodes.length.toLocaleString()} items. Search,
					or trace an item, to focus.
				</Muted>
			) : null;
		canvasArea = (
			<DependencyMapCanvas
				index={index}
				emphasis={emphasis}
				access={access}
				selectedId={view.selectedId}
				selectedEdgeId={view.selectedEdgeId}
				onSelectNode={actions.selectNode}
				onSelectEdge={actions.selectEdge}
				onClearSelection={clearSelection}
				onInit={(instance) => {
					flowRef.current = instance;
				}}
				defaultViewport={startViewport}
			>
				{view.lens === "none" ? null : (
					<Panel position="top-left">
						<DependencyMapViewBar
							index={index}
							view={view}
							onViewChange={setView}
							impact={impact}
							userName={userName}
							onUserNameChange={setUserName}
							accessCount={access ? access.size : null}
							gapCount={gapCount}
							isAccessLoading={userAccess.isLoading}
							accessError={
								view.lens === "access" ? userAccess.error : null
							}
						/>
					</Panel>
				)}
				<Panel position="top-right">
					<DependencyMapLegend
						index={index}
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
					index={index}
					view={view}
					onViewChange={setView}
					onClearFilters={clearFilters}
					matches={matches}
					onJump={jumpTo}
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
							onClose={clearSelection}
						/>
					</div>
				) : null}
			</div>
		</div>
	);

	return (
		<DependencyMapActionsContext.Provider value={actions}>
			{isExpanded ? (
				<>
					<div
						className={cn(
							MAP_HEIGHT_CLASS,
							"flex items-center justify-center rounded-lg border",
						)}
					>
						<Muted>The map is expanded.</Muted>
					</div>
					<Dialog
						open={true}
						onOpenChange={(open) => {
							if (!open) {
								collapse();
							}
						}}
					>
						<DialogContent
							showCloseButton={false}
							className={EXPANDED_CLASS}
							onEscapeKeyDown={(event) => {
								// Escape closes the drawer before it collapses the map
								if (hasSelection) {
									event.preventDefault();
									clearSelection();
								}
							}}
						>
							<DialogTitle className="sr-only">
								Dependency Map
							</DialogTitle>
							<DialogDescription className="sr-only">
								The dependency map, expanded to fill the window
							</DialogDescription>
							{mapArea}
						</DialogContent>
					</Dialog>
				</>
			) : (
				mapArea
			)}
			<DependencySyncDialog
				open={isSyncOpen}
				onOpenChange={setIsSyncOpen}
				index={index}
				onSynced={refresh}
				onJump={jumpTo}
			/>
		</DependencyMapActionsContext.Provider>
	);
};
