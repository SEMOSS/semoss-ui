import { Panel, type ReactFlowInstance } from "@xyflow/react";
import { Info, Network, Pencil } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	CatalogDependency,
	CatalogDependencyLink,
	CatalogDependencyRow,
	CatalogType,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	ButtonGroup,
	cn,
	H4,
	Muted,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useIsMobile,
} from "@semoss/ui/next";
import { DiscardChangesDialog } from "@/features/bulk-access-management/discard-changes-dialog";
import type { DependencyFlowEdge } from "@/features/dependency-map/dependency-edge";
import { DependencyMapSearch } from "@/features/dependency-map/dependency-map-search";
import type { DependencyFlowNode } from "@/features/dependency-map/dependency-node";
import { ExpandCanvasButton } from "@/features/dependency-map/expand-canvas-button";
import { ExpandedCanvasDialog } from "@/features/dependency-map/expanded-canvas-dialog";
import { focusCanvasItem } from "@/features/dependency-map/focus-canvas-item";
import { useExpandableCanvas } from "@/features/dependency-map/use-expandable-canvas";
import { AddDependencyPanel } from "./add-dependency-panel";
import { getDependencyTypeConfig } from "./catalog-dependency";
import { CatalogDependencyCanvas } from "./catalog-dependency-canvas";
import {
	applyDraftToGraph,
	getOwnDraftLink,
	getTakenNames,
} from "./catalog-dependency-draft";
import { CatalogDependencyDrawer } from "./catalog-dependency-drawer";
import {
	buildCatalogDependencyGraph,
	type CatalogGraphNode,
	GRAPH_NODE_SIZE,
	getDependencyGraphView,
	getPathToNode,
	searchCatalogGraph,
} from "./catalog-dependency-graph";
import { CatalogDependencyLegend } from "./catalog-dependency-legend";
import {
	CatalogDependencyMenuItems,
	type MenuEditActions,
} from "./catalog-dependency-menu-items";
import { DependencyEditBar } from "./dependency-edit-bar";
import { DependencyLinkForm } from "./dependency-link-form";
import { FIT_VIEW_OPTIONS } from "./fit-view-on-change";
import { RequestDependencyAccessDialog } from "./request-dependency-access-dialog";
import { useCatalogDependents } from "./use-catalog-dependents";
import { useDependencyDraft } from "./use-dependency-draft";

interface CatalogDependenciesViewProps {
	/** The owner's id */
	catalogId: string;
	/** The owner's specific type */
	catalogType: CatalogType;
	/** The owner's name */
	catalogName: string;
	/** The owner's subtype, for an engine's logo */
	catalogSubtype?: string | null;
	/** The owner's description */
	catalogDescription?: string | null;
	/** Whether the user can edit the owner's dependencies here */
	canEdit: boolean;
	/**
	 * Why the dependencies cannot be edited here; editors who can are told to
	 * use the edit button when it is left out
	 */
	editHint?: string;
	/**
	 * The owner's direct dependencies, automatic and manual, one row per
	 * target and role; editing the canvas edits the manual ones
	 */
	dependencies: CatalogDependencyRow[];
	/** Every node the owner reaches and every link between them */
	graph: {
		nodes: readonly CatalogDependency[];
		links: readonly CatalogDependencyLink[];
	};
	/** Reads the dependencies again, after an edit or a request */
	onRefresh: () => void;
}

const NO_EXPANDED: ReadonlySet<string> = new Set();

const DEFAULT_EDIT_HINT = "Add or remove dependencies using the edit button";

/**
 * An engine's or a project's Ontology tab, laid out as the admin Ontology is:
 * a toolbar with the search and Expand, then the graph with its drawer beside
 * it (on a phone, in its place). The graph has the owner in the middle, what
 * uses it directly on the left and what it uses directly on the right, each
 * item with the user's access to it; right-click an item (or use its "+N") to
 * show the next level beyond it. Items the user cannot see are named only by
 * their type ("Private Database"). Clicking an item opens it in the drawer
 * with its description, why it is connected, and Request Access, which asks
 * for that one item. Editors edit the manual dependencies on the canvas itself, as the
 * automation canvas edits a workflow: Edit Dependencies turns it into a
 * draft, with an edit bar on top (Add Dependency, Discard, Save), Remove or
 * Undo at each manual link's midpoint, and each link's name and description
 * in the drawer. Nothing is saved until Save, which sends them all at once.
 * Automatic ones come from the owner's configuration and show a lock.
 */
export const CatalogDependenciesView = ({
	catalogId,
	catalogType,
	catalogName,
	catalogSubtype,
	catalogDescription,
	canEdit,
	editHint,
	dependencies,
	graph: graphData,
	onRefresh,
}: CatalogDependenciesViewProps) => {
	const isMobile = useIsMobile();
	const [expandedIds, setExpandedIds] =
		useState<ReadonlySet<string>>(NO_EXPANDED);
	const [selectedId, setSelectedId] = useState("");
	const [query, setQuery] = useState("");
	const [isAdding, setIsAdding] = useState(false);
	const [isDiscardOpen, setIsDiscardOpen] = useState(false);
	const [requestTarget, setRequestTarget] = useState<CatalogGraphNode | null>(
		null,
	);
	const flowRef =
		useRef<ReactFlowInstance<DependencyFlowNode, DependencyFlowEdge>>(null);
	const {
		isExpanded,
		toggle: toggleExpanded,
		collapse,
	} = useExpandableCanvas(flowRef);

	const dependents = useCatalogDependents({ catalogId, catalogType });
	const draft = useDependencyDraft({
		catalogId,
		catalogType,
		saved: dependencies,
		onSaved: () => {
			onRefresh();
			dependents.refresh();
		},
	});
	const { isEditing, links: draftLinks, remove, restore } = draft;
	const ownerLabel = getDependencyTypeConfig(catalogType).label.toLowerCase();
	const hasAutomatic = dependencies.some((d) => d.is_automatic);
	const hint = editHint ?? (canEdit ? DEFAULT_EDIT_HINT : undefined);

	// while editing, the owner's manual links are the draft's
	const graph = useMemo(() => {
		const edited = applyDraftToGraph(
			{ nodes: graphData.nodes, links: graphData.links },
			draftLinks,
			catalogId,
		);
		return buildCatalogDependencyGraph({
			root: {
				id: catalogId,
				type: catalogType,
				name: catalogName,
				subtype: catalogSubtype,
				description: catalogDescription,
			},
			nodes: edited.nodes,
			links: edited.links,
			dependents: dependents.dependents,
			hiddenCount: dependents.hiddenCount,
			unknownAccessIds: edited.addedIds,
		});
	}, [
		catalogId,
		catalogType,
		catalogName,
		catalogSubtype,
		catalogDescription,
		graphData.nodes,
		graphData.links,
		draftLinks,
		dependents.dependents,
		dependents.hiddenCount,
	]);
	// editing works on the owner's own links, so only the direct ones show
	const shownExpandedIds = isEditing ? NO_EXPANDED : expandedIds;
	const view = useMemo(
		() => getDependencyGraphView(graph, { expandedIds: shownExpandedIds }),
		[graph, shownExpandedIds],
	);
	const matches = useMemo(
		() => searchCatalogGraph(graph, query),
		[graph, query],
	);
	const matchIds = useMemo(() => new Set(matches), [matches]);
	// while editing the canvas shows, empty or not, so links can be added
	const isEmpty = graph.nodes.size === 1 && !isEditing;
	const selectedNode = graph.nodes.get(selectedId) ?? null;
	const selectedLink = selectedNode
		? getOwnDraftLink(selectedNode, draftLinks)
		: undefined;

	const handleExpand = useCallback((id: string) => {
		setExpandedIds((previous) => new Set(previous).add(id));
	}, []);

	const handleCollapse = (id: string): void => {
		setExpandedIds((previous) => {
			const next = new Set(previous);
			next.delete(id);
			return next;
		});
	};

	const closeDrawer = useCallback((): void => setSelectedId(""), []);

	/** Closes the drawer and puts focus back on the item it showed. */
	const closeDrawerAndRefocus = (): void => {
		const openId = selectedId;
		closeDrawer();
		requestAnimationFrame(() => focusCanvasItem(openId));
	};

	const startEditing = (): void => {
		setExpandedIds(NO_EXPANDED);
		draft.start();
	};

	const stopEditing = (): void => {
		setIsDiscardOpen(false);
		setIsAdding(false);
		draft.discard();
	};

	/** Leaves edit mode, asking first when there are changes. */
	const handleDiscard = (): void => {
		if (draft.changeCount > 0) {
			setIsDiscardOpen(true);
		} else {
			stopEditing();
		}
	};

	const handleSave = async (): Promise<void> => {
		const changeCount = draft.changeCount;
		if (await draft.save()) {
			setIsAdding(false);
			toast.success(
				changeCount === 1
					? "1 dependency change saved"
					: `${changeCount} dependency changes saved`,
			);
		}
	};

	const handleAdd = useCallback((): void => {
		closeDrawer();
		setIsAdding(true);
	}, [closeDrawer]);

	/** Opens a manual link's target in the drawer, with its form. */
	const handleEditLink = useCallback((id: string): void => {
		setIsAdding(false);
		setSelectedId(id);
	}, []);

	const handleRemove = useCallback(
		(id: string): void => {
			// a new link goes at once, so its drawer closes with it
			if (draftLinks?.get(id)?.isNew) {
				setSelectedId((current) => (current === id ? "" : current));
			}
			remove(id);
		},
		[draftLinks, remove],
	);

	// one set of edit actions for the canvas and its menu, kept while the draft
	// is unchanged, so the canvas does not rebuild its nodes and edges
	const edit = useMemo(
		(): MenuEditActions | undefined =>
			draftLinks
				? {
						links: draftLinks,
						onRemove: handleRemove,
						onRestore: restore,
						onAdd: handleAdd,
						onEditLink: handleEditLink,
					}
				: undefined,
		[draftLinks, handleRemove, restore, handleAdd, handleEditLink],
	);

	/**
	 * Opens an item in the drawer, from the search or the drawer's own lists:
	 * an item beyond the levels shown has every level up to it shown first,
	 * and one already shown is centred.
	 */
	const handleJump = (id: string): void => {
		if (!graph.nodes.has(id)) {
			return;
		}
		const path = getPathToNode(graph, id);
		if (path.some((step) => !expandedIds.has(step))) {
			setExpandedIds((previous) => new Set([...previous, ...path]));
		}
		setSelectedId(id);
		const placed = view.nodes.find((n) => n.id === id);
		if (placed && flowRef.current) {
			void flowRef.current.setCenter(
				placed.x + GRAPH_NODE_SIZE.width / 2,
				placed.y + GRAPH_NODE_SIZE.height / 2,
				{ zoom: flowRef.current.getZoom(), duration: 300 },
			);
		}
	};

	/**
	 * Escape closes Add Dependency or the drawer first, then leaves edit mode,
	 * asking first when there are changes. While editing it is always taken,
	 * so it never collapses the expanded view.
	 *
	 * @returns Whether Escape was taken.
	 */
	const handleEscape = (): boolean => {
		if (isAdding) {
			setIsAdding(false);
		} else if (selectedId) {
			closeDrawerAndRefocus();
		} else if (isEditing) {
			if (!draft.isSaving) {
				handleDiscard();
			}
		} else {
			return false;
		}
		return true;
	};

	// Expanded, the dialog's own Escape runs first, wherever focus is, and
	// routes it here (see `onEscapeKeyDown`). React bubbles keys out of
	// portals, so a menu open over the graph closes on its own Escape instead
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
		const isFromGraph =
			event.target instanceof Node &&
			event.currentTarget.contains(event.target);
		if (
			event.key === "Escape" &&
			isFromGraph &&
			!isExpanded &&
			handleEscape()
		) {
			event.preventDefault();
		}
	};

	// on a phone the drawer takes the canvas's place until it is closed
	const isCanvasShown = !(isMobile && (selectedNode || isAdding));

	const graphArea: ReactNode = (
		// biome-ignore lint/a11y/noStaticElementInteractions: Escape here only closes the drawer; the drawer's Close button does the same
		<div
			className={cn(
				"flex min-h-0 flex-col gap-2",
				isExpanded ? "size-full" : "h-120 md:h-160",
			)}
			onKeyDown={handleKeyDown}
		>
			<div className="flex flex-wrap items-center gap-2">
				<DependencyMapSearch
					query={query}
					onQueryChange={setQuery}
					matches={matches}
					onJump={handleJump}
				/>
				<ButtonGroup aria-label="Ontology actions" className="ml-auto">
					<ExpandCanvasButton
						isExpanded={isExpanded}
						onToggle={toggleExpanded}
					/>
				</ButtonGroup>
			</div>
			{dependents.error ? (
				<Alert variant="destructive">
					<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
						{`Couldn't read what uses this ${ownerLabel}: ${dependents.error.message}`}
						<Button
							variant="outline"
							size="sm"
							onClick={dependents.refresh}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			<div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border">
				{isCanvasShown ? (
					<div className="relative min-w-0 flex-1">
						<CatalogDependencyCanvas
							view={view}
							rootId={catalogId}
							selectedId={selectedId}
							matchIds={matchIds}
							onSelect={setSelectedId}
							onClearSelection={closeDrawer}
							onExpand={handleExpand}
							edit={edit}
							onInit={(instance) => {
								flowRef.current = instance;
							}}
							renderMenu={(target) => (
								<CatalogDependencyMenuItems
									target={target}
									graph={graph}
									view={view}
									expandedIds={expandedIds}
									onOpenDetails={setSelectedId}
									onExpand={handleExpand}
									onCollapse={handleCollapse}
									onRequestAccess={setRequestTarget}
									onFitView={() =>
										void flowRef.current?.fitView({
											...FIT_VIEW_OPTIONS,
											duration: 300,
										})
									}
									onShowDirectOnly={() =>
										setExpandedIds(NO_EXPANDED)
									}
									edit={edit}
								/>
							)}
						>
							{isEditing ? (
								<Panel
									position="top-center"
									className="w-full max-w-xl px-4"
								>
									<DependencyEditBar
										changeCount={draft.changeCount}
										problemCount={draft.problems.size}
										isSaving={draft.isSaving}
										saveError={draft.saveError}
										onAdd={handleAdd}
										onDiscard={handleDiscard}
										onSave={() => void handleSave()}
									/>
								</Panel>
							) : (
								<Panel position="top-right">
									<CatalogDependencyLegend
										nodes={view.nodes}
									/>
								</Panel>
							)}
						</CatalogDependencyCanvas>
					</div>
				) : null}
				{(draftLinks && isAdding) || selectedNode ? (
					<div
						className={cn("shrink-0", isMobile ? "w-full" : "w-md")}
					>
						{draftLinks && isAdding ? (
							<AddDependencyPanel
								catalogId={catalogId}
								linkedIds={
									new Set(
										[...draftLinks.values()]
											.filter((link) => !link.isRemoved)
											.map((link) => link.catalog_id),
									)
								}
								onPick={(option) => {
									draft.add(option);
									handleEditLink(option.catalog_id);
								}}
								onClose={() => setIsAdding(false)}
							/>
						) : selectedNode ? (
							<CatalogDependencyDrawer
								graph={graph}
								node={selectedNode}
								onClose={closeDrawerAndRefocus}
								onSelect={handleJump}
								onRequestAccess={setRequestTarget}
							>
								{draftLinks && selectedLink ? (
									<DependencyLinkForm
										key={selectedLink.catalog_id}
										link={selectedLink}
										takenNames={getTakenNames(
											draftLinks.values(),
											selectedLink.catalog_id,
										)}
										problem={draft.problems.get(
											selectedLink.catalog_id,
										)}
										onChange={(change) =>
											draft.update(
												selectedLink.catalog_id,
												change,
											)
										}
										onRemove={() =>
											handleRemove(
												selectedLink.catalog_id,
											)
										}
										onRestore={() =>
											restore(selectedLink.catalog_id)
										}
									/>
								) : null}
							</CatalogDependencyDrawer>
						) : null}
					</div>
				) : null}
			</div>
		</div>
	);

	return (
		<>
			<div className="flex w-full flex-col gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<H4 className="text-base">Ontology</H4>
							{hint ? (
								<Tooltip disableHoverableContent={false}>
									<TooltipTrigger asChild>
										<button
											type="button"
											aria-label={hint}
											className="rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										>
											<Info
												className="size-4"
												aria-hidden="true"
											/>
										</button>
									</TooltipTrigger>
									<TooltipContent>{hint}</TooltipContent>
								</Tooltip>
							) : null}
						</div>
						<Muted className="max-w-prose">
							What this {ownerLabel} uses and what uses it, one
							link out. Right-click an item to go further, or to
							open or request it. You need access to everything it
							uses for it to work fully for you.
							{hasAutomatic
								? ` Automatic dependencies come from this ${ownerLabel}'s configuration and can only be changed there.`
								: null}
						</Muted>
					</div>
					{/* when empty, the empty state offers the edit */}
					{canEdit && !isEmpty && !isEditing ? (
						<Button
							variant="outline"
							size="sm"
							className="shrink-0 self-start"
							onClick={startEditing}
							data-testid="catalogDependenciesView-edit-btn"
						>
							<Pencil aria-hidden="true" />
							Edit Dependencies
						</Button>
					) : null}
				</div>

				{isEmpty ? (
					<div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-12 text-center">
						<Network
							className="size-8 text-muted-foreground"
							aria-hidden="true"
						/>
						<div className="flex flex-col gap-1">
							<P className="font-medium text-sm">
								No dependencies yet
							</P>
							<Muted>
								Nothing this {ownerLabel} uses, and nothing that
								uses it, is recorded.
							</Muted>
						</div>
						{canEdit ? (
							<Button
								variant="outline"
								size="sm"
								onClick={startEditing}
							>
								<Pencil aria-hidden="true" />
								Edit Dependencies
							</Button>
						) : null}
					</div>
				) : isExpanded ? (
					// Escape closes the drawer and leaves edit mode before it collapses
					<ExpandedCanvasDialog
						title={`${catalogName}'s ontology`}
						placeholderClassName="h-120 md:h-160"
						onEscape={handleEscape}
						onCollapse={collapse}
					>
						{graphArea}
					</ExpandedCanvasDialog>
				) : (
					graphArea
				)}
			</div>

			{requestTarget ? (
				<RequestDependencyAccessDialog
					target={requestTarget}
					ownerName={catalogName}
					onClose={(didRequest) => {
						setRequestTarget(null);
						if (didRequest) {
							onRefresh();
						}
					}}
				/>
			) : null}

			<DiscardChangesDialog
				open={isDiscardOpen}
				reason="DISCARD"
				changeCount={draft.changeCount}
				onConfirm={stopEditing}
				onCancel={() => setIsDiscardOpen(false)}
				unchangedText="the dependencies stay as they are"
			/>
		</>
	);
};
