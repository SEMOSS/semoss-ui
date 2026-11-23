import { Panel, type ReactFlowInstance } from "@xyflow/react";
import { Info, Network, Pencil, Plus, RefreshCw } from "lucide-react";
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
	P,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useIsMobile,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { syncCatalogDependencies } from "@/api/catalog-dependencies";
import { DiscardChangesDialog } from "@/features/bulk-access-management/discard-changes-dialog";
import { useUnsavedChangesGuard } from "@/features/bulk-access-management/use-unsaved-changes-guard";
import type { DependencyFlowEdge } from "@/features/dependency-map/dependency-edge";
import { DependencyMapSearch } from "@/features/dependency-map/dependency-map-search";
import type { DependencyFlowNode } from "@/features/dependency-map/dependency-node";
import { ExpandCanvasButton } from "@/features/dependency-map/expand-canvas-button";
import { ExpandedCanvasDialog } from "@/features/dependency-map/expanded-canvas-dialog";
import { focusCanvasItem } from "@/features/dependency-map/focus-canvas-item";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";
import { useExpandableCanvas } from "@/features/dependency-map/use-expandable-canvas";
import { getDependencyTypeConfig } from "./catalog-dependency";
import { CatalogDependencyCanvas } from "./catalog-dependency-canvas";
import {
	applyDraftToGraph,
	collectTakenNames,
	getOwnDraftLink,
} from "./catalog-dependency-draft";
import { CatalogDependencyDrawer } from "./catalog-dependency-drawer";
import {
	buildCatalogDependencyGraph,
	type CatalogGraphNode,
	GRAPH_NODE_SIZE,
	getDependencyGraphView,
	getPathToNode,
	searchCatalogGraph,
	type TraversalKey,
	type TraverseDirection,
} from "./catalog-dependency-graph";
import { CatalogDependencyLegend } from "./catalog-dependency-legend";
import {
	CatalogDependencyMenuItems,
	type MenuEditActions,
} from "./catalog-dependency-menu-items";
import { DependencyLinkDialog } from "./dependency-link-dialog";
import { DependencySaveControls } from "./dependency-save-controls";
import { FIT_VIEW_OPTIONS } from "./fit-view-on-change";
import { RequestDependencyAccessDialog } from "./request-dependency-access-dialog";
import { useCatalogDependents } from "./use-catalog-dependents";
import { useDependencyDraft } from "./use-dependency-draft";
import { useOntologyTraversals } from "./use-ontology-traversals";

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
	 * Whether the user can record the owner's automatic dependencies again
	 * from its configuration: its editors, even where its manual ones are
	 * edited elsewhere. Defaults to `canEdit`
	 */
	canResync?: boolean;
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

const NO_TRAVERSALS: ReadonlySet<TraversalKey> = new Set();

const DEFAULT_EDIT_HINT = "Add or remove dependencies using the edit button";

/**
 * An engine's or a project's Ontology tab, laid out as the admin Ontology is:
 * a toolbar with the search and Expand, then the graph with its drawer beside
 * it (on a phone, in its place). The graph has the owner in the middle, what
 * uses it directly on the left and what it uses directly on the right, each
 * item with the user's access to it; right-click an item (or use the "+" on
 * its side) to traverse upstream to what it uses or downstream to what uses
 * it, in place, reading that way for it first when needed. Items the user cannot see are named only by
 * their type ("Private Database"). Clicking an item opens it in the drawer
 * with its description, why it is connected, and Request Access, which asks
 * for that one item. Editors edit the manual dependencies on the canvas itself, as the
 * automation canvas edits a workflow: Edit Dependencies turns it into a
 * draft: the toolbar says so beside Save, Reset and Done, as the database
 * metamodel page does; Add Dependency is a "+" on the canvas, a pencil on
 * each manual link's target opens it to edit, and Remove
 * or Undo at each manual link's midpoint. Adding a link and editing one open
 * the same dialog, with its target, its name (required) and its description;
 * an added link then reads as every other dependency does. Nothing is saved
 * until Save, which sends them all at once.
 * Automatic ones come from the owner's configuration and show a lock.
 */
export const CatalogDependenciesView = ({
	catalogId,
	catalogType,
	catalogName,
	catalogSubtype,
	catalogDescription,
	canEdit,
	canResync = canEdit,
	editHint,
	dependencies,
	graph: graphData,
	onRefresh,
}: CatalogDependenciesViewProps) => {
	const [isResyncing, setIsResyncing] = useState(false);
	const isMobile = useIsMobile();
	// the view is keyed by its owner, so another owner starts over
	const traversal = useOntologyTraversals();
	const [selectedId, setSelectedId] = useState("");
	const [query, setQuery] = useState("");
	/**
	 * The link dialog while it is open: the id of the link it edits, or null
	 * when it adds one
	 */
	const [linkDialog, setLinkDialog] = useState<{
		readonly linkId: string | null;
	} | null>(null);
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
			// what was read past the owner may have changed with the save
			traversal.reset();
			onRefresh();
			dependents.refresh();
		},
	});
	const { isEditing, links: draftLinks, remove, restore } = draft;
	// leaving the page with changes asks first: the browser for a close or
	// reload, the discard dialog for a move within the app
	const leaveBlocker = useUnsavedChangesGuard(draft.changeCount > 0);
	const ownerLabel = getDependencyTypeConfig(catalogType).label.toLowerCase();
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
			extraDependents: traversal.extraDependents,
			extraDependencies: traversal.extraDependencies,
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
		traversal.extraDependents,
		traversal.extraDependencies,
	]);
	// editing works on the owner's own links, so only the direct ones show;
	// the traversals are kept for when editing ends
	const shownTraversals = isEditing ? NO_TRAVERSALS : traversal.traversals;
	const view = useMemo(
		() => getDependencyGraphView(graph, { traversals: shownTraversals }),
		[graph, shownTraversals],
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
	// the link the dialog edits; one gone from the draft closes the dialog
	// rather than turning it into Add Dependency
	const dialogLink =
		linkDialog?.linkId == null
			? undefined
			: draftLinks?.get(linkDialog.linkId);
	const isLinkDialogShown =
		draftLinks !== null &&
		linkDialog !== null &&
		(linkDialog.linkId === null || dialogLink !== undefined);

	const { traverse } = traversal;
	/** Traverses from an item, reading that way first when it is not known. */
	const handleTraverse = useCallback(
		(id: string, direction: TraverseDirection): void => {
			const node = graph.nodes.get(id);
			if (!node) {
				return;
			}
			const isKnown = (
				direction === "UPSTREAM"
					? graph.knownUpstream
					: graph.knownDownstream
			).has(id);
			void traverse(node, direction, isKnown);
		},
		[graph, traverse],
	);

	const handleCloseDrawer = useCallback((): void => setSelectedId(""), []);

	/** Closes the drawer and puts focus back on the item it showed. */
	const handleCloseDrawerAndRefocus = (): void => {
		const openId = selectedId;
		handleCloseDrawer();
		requestAnimationFrame(() => focusCanvasItem(openId));
	};

	const handleStartEditing = (): void => {
		traversal.clear();
		draft.start();
	};

	const handleStopEditing = (): void => {
		setIsDiscardOpen(false);
		setLinkDialog(null);
		draft.discard();
	};

	/** Leaves edit mode, asking first when there are changes. */
	const handleDone = (): void => {
		if (draft.changeCount > 0) {
			setIsDiscardOpen(true);
		} else {
			handleStopEditing();
		}
	};

	const handleSave = async (): Promise<void> => {
		const changeCount = draft.changeCount;
		if (await draft.save()) {
			toast.success(
				changeCount === 1
					? "1 dependency change saved"
					: `${changeCount} dependency changes saved`,
			);
		}
	};

	/**
	 * Records the owner's automatic dependencies again from its configuration,
	 * then reads what it uses and what uses it again.
	 */
	const handleResync = async (): Promise<void> => {
		setIsResyncing(true);
		try {
			const count = await syncCatalogDependencies(catalogId, catalogType);
			toast.success(
				count === 1
					? "Synced: 1 automatic dependency from the configuration"
					: `Synced: ${count} automatic dependencies from the configuration`,
			);
		} catch (error: unknown) {
			toast.error(
				getErrorMessage(error, "Couldn't sync the dependencies"),
			);
			return;
		} finally {
			setIsResyncing(false);
		}
		traversal.reset();
		onRefresh();
		dependents.refresh();
	};

	const handleAdd = useCallback((): void => {
		setLinkDialog({ linkId: null });
	}, []);

	/** Opens a manual link's name and description in the link dialog. */
	const handleEditLink = useCallback((id: string): void => {
		setLinkDialog({ linkId: id });
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
	 * an item not on the canvas has the traversals that reach it shown first,
	 * and one already shown is centred.
	 */
	const handleJump = (id: string): void => {
		if (!graph.nodes.has(id)) {
			return;
		}
		traversal.showPath(getPathToNode(graph, id));
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
	 * Escape closes the drawer first, then leaves edit mode, asking first when
	 * there are changes. While editing it is always taken, so it never
	 * collapses the expanded view. The link dialog takes its own Escape.
	 *
	 * @returns Whether Escape was taken.
	 */
	const handleEscape = (): boolean => {
		if (selectedId) {
			handleCloseDrawerAndRefocus();
		} else if (isEditing) {
			if (!draft.isSaving) {
				handleDone();
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
	const isCanvasShown = !(isMobile && selectedNode);

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
				<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
					{isEditing ? (
						<DependencySaveControls
							changeCount={draft.changeCount}
							changes={draft.changes}
							problemCount={draft.problems.size}
							isSaving={draft.isSaving}
							onReset={draft.reset}
							onSave={() => void handleSave()}
							onDone={handleDone}
						/>
					) : null}
					<ButtonGroup aria-label="Ontology actions">
						{!isEditing && canResync ? (
							<MapTooltip
								label={
									isResyncing
										? "Syncing..."
										: "Sync Dependencies"
								}
							>
								<Button
									type="button"
									size="icon-sm"
									variant="outline"
									aria-label={
										isResyncing
											? "Syncing..."
											: "Sync Dependencies"
									}
									disabled={isResyncing}
									onClick={() => void handleResync()}
									data-testid="catalogDependenciesView-resync-btn"
								>
									{isResyncing ? (
										<Spinner className="size-4" />
									) : (
										<RefreshCw aria-hidden="true" />
									)}
								</Button>
							</MapTooltip>
						) : null}
						{!isEditing && canEdit ? (
							<MapTooltip label="Edit Dependencies">
								<Button
									type="button"
									size="icon-sm"
									variant="outline"
									aria-label="Edit Dependencies"
									onClick={handleStartEditing}
									data-testid="catalogDependenciesView-edit-btn"
								>
									<Pencil aria-hidden="true" />
								</Button>
							</MapTooltip>
						) : null}
						<ExpandCanvasButton
							isExpanded={isExpanded}
							onToggle={toggleExpanded}
						/>
					</ButtonGroup>
				</div>
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
							onClearSelection={handleCloseDrawer}
							edit={edit}
							onInit={(instance) => {
								flowRef.current = instance;
							}}
							renderMenu={(target) => (
								<CatalogDependencyMenuItems
									target={target}
									graph={graph}
									view={view}
									hasTraversals={
										traversal.traversals.size > 0
									}
									pendingTraversals={
										traversal.pendingTraversals
									}
									onOpenItem={setSelectedId}
									onTraverse={handleTraverse}
									onHide={traversal.hide}
									onRequestAccess={setRequestTarget}
									onFitView={() =>
										void flowRef.current?.fitView({
											...FIT_VIEW_OPTIONS,
											duration: 300,
										})
									}
									onShowDirectOnly={traversal.clear}
									edit={edit}
								/>
							)}
						>
							{isEditing ? (
								<>
									<Panel position="top-left">
										<MapTooltip label="Add Dependency">
											<Button
												type="button"
												size="icon"
												variant="outline"
												aria-label="Add Dependency"
												disabled={draft.isSaving}
												className="rounded-full bg-background shadow-sm"
												onClick={handleAdd}
											>
												<Plus aria-hidden="true" />
											</Button>
										</MapTooltip>
									</Panel>
									{draft.problems.size > 0 ||
									draft.saveError ? (
										<Panel
											position="top-center"
											className="w-full max-w-md px-4"
										>
											<Alert variant="destructive">
												<AlertDescription>
													{draft.problems.size > 0
														? draft.problems
																.size === 1
															? "1 dependency needs a different name before you can save."
															: `${draft.problems.size} dependencies need different names before you can save.`
														: draft.saveError}
												</AlertDescription>
											</Alert>
										</Panel>
									) : null}
								</>
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
				{selectedNode ? (
					<div
						className={cn("shrink-0", isMobile ? "w-full" : "w-md")}
					>
						<CatalogDependencyDrawer
							graph={graph}
							node={selectedNode}
							onClose={handleCloseDrawerAndRefocus}
							onOpenItem={handleJump}
							onRequestAccess={setRequestTarget}
							problem={
								selectedLink
									? draft.problems.get(
											selectedLink.catalog_id,
										)
									: undefined
							}
							canEditOwner={canEdit || canResync}
							linkActions={
								selectedLink
									? {
											isRemoved: selectedLink.isRemoved,
											onEdit: () =>
												handleEditLink(
													selectedLink.catalog_id,
												),
											onRemove: () =>
												handleRemove(
													selectedLink.catalog_id,
												),
											onRestore: () =>
												restore(
													selectedLink.catalog_id,
												),
										}
									: undefined
							}
						/>
					</div>
				) : null}
			</div>
		</div>
	);

	return (
		<>
			<div className="flex w-full flex-col gap-4">
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
					<P className="text-muted-foreground text-sm">
						What this {ownerLabel} uses and what uses it.
						Right-click an item to traverse upstream or downstream.
					</P>
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
							<P className="text-muted-foreground text-sm">
								Nothing this {ownerLabel} uses, and nothing that
								uses it, is recorded.
							</P>
						</div>
						{/* the toolbar is not shown while empty, so its actions are here */}
						{canEdit || canResync ? (
							<div className="flex flex-wrap justify-center gap-2">
								{canResync ? (
									<Button
										variant="outline"
										size="sm"
										disabled={isResyncing}
										onClick={() => void handleResync()}
									>
										{isResyncing ? (
											<Spinner className="size-4" />
										) : (
											<RefreshCw aria-hidden="true" />
										)}
										{isResyncing
											? "Syncing..."
											: "Sync Dependencies"}
									</Button>
								) : null}
								{canEdit ? (
									<Button
										variant="outline"
										size="sm"
										onClick={handleStartEditing}
									>
										<Pencil aria-hidden="true" />
										Edit Dependencies
									</Button>
								) : null}
							</div>
						) : null}
					</div>
				) : isExpanded ? (
					// Escape closes the drawer and leaves edit mode before it collapses
					<ExpandedCanvasDialog
						title={`${catalogName}'s Ontology`}
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

			{isLinkDialogShown && draftLinks && linkDialog ? (
				<DependencyLinkDialog
					// a new form for each link, so one never starts from another's
					key={linkDialog.linkId ?? ""}
					catalogId={catalogId}
					link={dialogLink}
					linkedIds={
						new Set(
							[...draftLinks.values()]
								.filter((link) => !link.isRemoved)
								.map((link) => link.catalog_id),
						)
					}
					problem={
						linkDialog.linkId === null
							? undefined
							: draft.problems.get(linkDialog.linkId)
					}
					takenNames={collectTakenNames(
						draftLinks.values(),
						linkDialog.linkId ?? "",
					)}
					onSubmit={(target, fields) => {
						if (linkDialog.linkId === null) {
							draft.add(target, fields);
						} else {
							draft.update(linkDialog.linkId, fields);
						}
						setLinkDialog(null);
					}}
					onClose={() => setLinkDialog(null)}
				/>
			) : null}

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
				open={leaveBlocker.state === "blocked"}
				reason="LEAVE"
				changeCount={draft.changeCount}
				onConfirm={() => leaveBlocker.proceed?.()}
				onCancel={() => leaveBlocker.reset?.()}
				unchangedText="the dependencies stay as they are"
			/>

			<DiscardChangesDialog
				open={isDiscardOpen}
				reason="DISCARD"
				changeCount={draft.changeCount}
				onConfirm={handleStopEditing}
				onCancel={() => setIsDiscardOpen(false)}
				unchangedText="the dependencies stay as they are"
			/>
		</>
	);
};
