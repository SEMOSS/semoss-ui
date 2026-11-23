import {
	ExternalLink,
	Lock,
	LockKeyhole,
	Network,
	Pencil,
	Trash2,
	TriangleAlert,
	Undo2,
} from "lucide-react";
import { Link } from "react-router";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Alert,
	AlertDescription,
	Badge,
	Button,
	ButtonGroup,
	cn,
	Muted,
	P,
	Separator,
} from "@semoss/ui/next";
import { ResourceId } from "@/components/shared/resource-id";
import {
	DependencyDrawer,
	DRAWER_FACT_CLASS,
	DRAWER_FACT_LABEL_CLASS,
	DRAWER_FACT_VALUE_CLASS,
	DRAWER_FACTS_CLASS,
	DRAWER_NOTE_CLASS,
	DRAWER_WIDE_FACT_CLASS,
} from "@/features/dependency-map/dependency-drawer";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import { DependencyLinkRow } from "@/features/dependency-map/dependency-link-row";
import { DrawerItemMeta } from "@/features/dependency-map/drawer-item-meta";
import { DrawerLineage } from "@/features/dependency-map/drawer-lineage";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";
import {
	canRequestDependency,
	DEPENDENCY_ACCESS_LEVEL_LABELS,
	describeAutomaticLink,
	getConfigurationPlace,
	getDependencyRoleLabel,
	getDependencyTypeConfig,
	getDependencyVisibilityLabel,
} from "./catalog-dependency";
import {
	type CatalogDependencyGraph,
	type CatalogGraphNode,
	type GraphNodeLink,
	getGraphNodePaths,
	getNodeLinks,
	HIDDEN_ROLE,
	PRIVATE_DEPENDENTS_LABEL,
} from "./catalog-dependency-graph";
import { DependencyAccessBadge } from "./dependency-access-badge";
import { DependencyKindBadge } from "./dependency-kind-badge";

/** Props for {@link CatalogDependencyDrawer}. */
interface CatalogDependencyDrawerProps {
	/** The owner's graph */
	graph: CatalogDependencyGraph;
	/** The item open in the drawer */
	node: CatalogGraphNode;
	/** Closes the drawer, putting focus back on the item it showed */
	onClose: () => void;
	/** Opens another item of the graph in the drawer */
	onOpenItem: (id: string) => void;
	/** Asks for access to the item */
	onRequestAccess: (node: CatalogGraphNode) => void;
	/**
	 * What stops the draft being saved on the owner's manual link to this
	 * item, such as a name another link has; shown under its name
	 */
	problem?: string;
	/**
	 * Whether the user can edit the owner, so a link to where its automatic
	 * dependencies are changed leads somewhere they can use
	 */
	canEditOwner?: boolean;
	/**
	 * The owner's manual link to this item while links are edited: Edit and
	 * Remove (or Undo once removed), as icons on the Configuration heading
	 */
	linkActions?: {
		/** Whether the link is to be removed on save */
		readonly isRemoved: boolean;
		/** Opens the link's name and description in the link dialog */
		readonly onEdit: () => void;
		/** Marks the link for removal, or drops a new one */
		readonly onRemove: () => void;
		/** Brings back a link marked for removal */
		readonly onRestore: () => void;
	};
}

/**
 * The details of one item of an Ontology tab, in a drawer beside the canvas,
 * built as the admin Ontology's drawer is. The header holds the item's image,
 * name, type and visibility, and its actions as icon buttons with tooltips:
 * Request Access, View Its Ontology, Open in Catalog, and Close. The item then
 * folds into Overview (its id, description and anything the user should know);
 * Configuration, listing each link between it and the owner with its type,
 * Manual or Automatic: a manual link's name (the key a Code app reads the
 * item's id by) and description, or an automatic link's role, why it exists
 * and where it is changed; and
 * Lineage (what it uses and what uses it, each link with its kind, each item
 * opening here in turn). A private item says only its
 * type, and how to get access. Its heading takes focus when it opens. While
 * the owner's links are edited, the owner's manual link has Edit and Remove
 * (or Undo) as icons on the Configuration heading, before its chevron.
 */
export const CatalogDependencyDrawer = ({
	graph,
	node,
	onClose,
	onOpenItem,
	onRequestAccess,
	problem,
	canEditOwner = false,
	linkActions,
}: CatalogDependencyDrawerProps) => {
	const root = graph.nodes.get(graph.rootId);
	const rootName = root?.name ?? "this item";
	const typeLabel = getDependencyTypeConfig(node.type).label.toLowerCase();
	const isRoot = node.id === graph.rootId;
	const isPlaceholder = node.hiddenCount !== undefined;
	const { uses, usedBy } = getNodeLinks(graph, node.id);
	const { access, dependency } = node;
	const { catalogPath, ontologyPath } = getGraphNodePaths(graph, node);
	const isRequestable = access ? canRequestDependency(access) : false;
	// the catalog keeps tags as one comma separated string; a private item has none
	const tags = [
		...new Set(
			(node.isPrivate ? "" : (dependency?.tags ?? ""))
				.split(",")
				.map((tag) => tag.trim())
				.filter(Boolean),
		),
	];
	const relation =
		isRoot || isPlaceholder
			? null
			: node.depth > 1
				? `${node.depth} links from ${rootName}`
				: node.side === "USES"
					? `Used by ${rootName}`
					: `Uses ${rootName}`;
	const hiddenCount = node.hiddenCount ?? 0;
	const isOne = hiddenCount === 1;
	// the links between this item and the owner, either way, are the ones
	// the Ontology tab is about; links further out show in Lineage only
	const ownLinks = isRoot
		? []
		: [...uses, ...usedBy].filter(
				({ other, edge }) =>
					other.id === graph.rootId && edge.role !== HIDDEN_ROLE,
			);
	// Edit and Remove act on the owner's own manual link to this item, and
	// sit on the Configuration line
	const headerActions = ownLinks.some(
		({ edge }) => !edge.isAutomatic && edge.source === graph.rootId,
	)
		? linkActions
		: undefined;

	const renderLinks = (links: readonly GraphNodeLink[]) =>
		links.length === 0 ? (
			<P className={DRAWER_NOTE_CLASS}>None</P>
		) : (
			<ul className="flex flex-col gap-1">
				{links.map(({ edge, other, sourceType }) => (
					<DependencyLinkRow
						key={edge.id}
						node={other}
						isPrivate={other.isPrivate}
						description={`${
							other.hiddenCount === undefined
								? getDependencyTypeConfig(other.type).label
								: PRIVATE_DEPENDENTS_LABEL
						}${!edge.isAutomatic && edge.name ? ` · ${edge.name}` : ""}`}
						link={
							edge.role === HIDDEN_ROLE
								? undefined
								: {
										isAutomatic: edge.isAutomatic,
										label: getDependencyRoleLabel(
											edge.role,
										),
									}
						}
						note={
							edge.role === HIDDEN_ROLE
								? null
								: (edge.description ??
									(edge.isAutomatic
										? describeAutomaticLink(sourceType)
										: null))
						}
						onOpenItem={() => onOpenItem(other.id)}
					/>
				))}
			</ul>
		);

	return (
		<DependencyDrawer
			label={node.name}
			title={node.name}
			media={
				isPlaceholder ? (
					<span
						aria-hidden="true"
						className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
					>
						<Lock className="size-5" />
					</span>
				) : (
					<DependencyItemImage
						node={node}
						isPrivate={node.isPrivate}
						className="size-10"
					/>
				)
			}
			actions={
				isRequestable || ontologyPath || catalogPath ? (
					<ButtonGroup aria-label="Item actions">
						{isRequestable ? (
							<MapTooltip label="Request Access">
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									aria-label="Request Access"
									onClick={() => onRequestAccess(node)}
								>
									<LockKeyhole aria-hidden="true" />
								</Button>
							</MapTooltip>
						) : null}
						{ontologyPath ? (
							<MapTooltip label="View Its Ontology">
								<Button asChild size="icon-sm" variant="ghost">
									<Link
										to={ontologyPath}
										aria-label="View Its Ontology"
									>
										<Network aria-hidden="true" />
									</Link>
								</Button>
							</MapTooltip>
						) : null}
						{catalogPath ? (
							<MapTooltip label="Open in Catalog">
								<Button asChild size="icon-sm" variant="ghost">
									<Link
										to={catalogPath}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Open in Catalog (opens in a new tab)"
									>
										<ExternalLink aria-hidden="true" />
									</Link>
								</Button>
							</MapTooltip>
						) : null}
					</ButtonGroup>
				) : null
			}
			meta={
				isPlaceholder ? (
					<Muted>{`Items that use ${rootName}`}</Muted>
				) : (
					<DrawerItemMeta
						key={node.id}
						type={node.type}
						subtype={node.subtype}
						tags={tags}
					>
						{access ? (
							<DependencyAccessBadge access={access} />
						) : null}
						{dependency && !node.isPrivate ? (
							<Badge variant="secondary">
								{getDependencyVisibilityLabel(dependency)}
							</Badge>
						) : null}
					</DrawerItemMeta>
				)
			}
			focusKey={node.id}
			onClose={onClose}
		>
			{/* a new key per item, so each opens on its overview */}
			<Accordion
				key={node.id}
				type="multiple"
				defaultValue={["overview", "configuration"]}
			>
				<AccordionItem value="overview">
					<AccordionTrigger>Overview</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4">
						{isPlaceholder ? (
							<P className="text-sm">
								{isOne
									? `1 item that uses ${rootName} is hidden from you: you have no access to it and it isn't discoverable. Changing ${rootName} may affect it.`
									: `${hiddenCount} items that use ${rootName} are hidden from you: you have no access to them and they aren't discoverable. Changing ${rootName} may affect them.`}
							</P>
						) : node.isPrivate ? (
							<Alert>
								<LockKeyhole aria-hidden="true" />
								<AlertDescription>
									{`You can't see this ${typeLabel}: you have no access to it and it isn't discoverable. ${rootName} needs it to work fully. Ask an owner of ${rootName}, or an admin, for access.`}
								</AlertDescription>
							</Alert>
						) : (
							<>
								<ResourceId id={node.id} name={node.name} />
								<dl className={DRAWER_FACTS_CLASS}>
									<div className={DRAWER_WIDE_FACT_CLASS}>
										<dt className={DRAWER_FACT_LABEL_CLASS}>
											Description
										</dt>
										<dd className={DRAWER_FACT_VALUE_CLASS}>
											{node.description ? (
												node.description
											) : (
												<span
													className={
														DRAWER_NOTE_CLASS
													}
												>
													{node.side === "USED_BY" ||
													isRoot
														? "Open it to read its description"
														: "No description"}
												</span>
											)}
										</dd>
									</div>
									{relation ? (
										<div className={DRAWER_WIDE_FACT_CLASS}>
											<dt
												className={
													DRAWER_FACT_LABEL_CLASS
												}
											>
												Connection
											</dt>
											<dd
												className={
													DRAWER_FACT_VALUE_CLASS
												}
											>
												{relation}
											</dd>
										</div>
									) : null}
								</dl>
							</>
						)}
						{access?.kind === "granted" && access.requested ? (
							<P className={DRAWER_NOTE_CLASS}>
								{`You asked for ${DEPENDENCY_ACCESS_LEVEL_LABELS[access.requested]} access. It waits on its owners.`}
							</P>
						) : null}
						{access?.kind === "requested" ? (
							<P className={DRAWER_NOTE_CLASS}>
								Your request waits on its owners. Open it to
								change or withdraw the request.
							</P>
						) : null}
						{/* a private item's notice already says what is missing */}
						{dependency?.can_view_dependencies === false &&
						!node.isPrivate ? (
							<Alert>
								<TriangleAlert
									aria-hidden="true"
									className="text-warning"
								/>
								<AlertDescription>
									{`You don't have access to all dependencies of this ${typeLabel}, so functionality may be limited. Open it for more information.`}
								</AlertDescription>
							</Alert>
						) : null}
					</AccordionContent>
				</AccordionItem>
				{ownLinks.length > 0 ? (
					<AccordionItem value="configuration">
						{/* the heading reads text, actions, chevron: the trigger
						    spans the line, as the other sections' do, and the
						    actions sit over it just before its chevron, outside
						    it, since a button cannot hold other buttons */}
						<div className="relative flex items-center [&>h3]:flex-1">
							<AccordionTrigger>Configuration</AccordionTrigger>
							{headerActions ? (
								<ButtonGroup
									aria-label="Dependency actions"
									className="-translate-y-1/2 absolute top-1/2 right-6"
								>
									{headerActions.isRemoved ? (
										<MapTooltip label="Undo Removal">
											<Button
												type="button"
												size="icon-sm"
												variant="ghost"
												aria-label="Undo Removal"
												onClick={
													headerActions.onRestore
												}
											>
												<Undo2 aria-hidden="true" />
											</Button>
										</MapTooltip>
									) : (
										<>
											<MapTooltip label="Edit Dependency">
												<Button
													type="button"
													size="icon-sm"
													variant="ghost"
													aria-label="Edit Dependency"
													onClick={
														headerActions.onEdit
													}
												>
													<Pencil aria-hidden="true" />
												</Button>
											</MapTooltip>
											<MapTooltip label="Remove Dependency">
												<Button
													type="button"
													size="icon-sm"
													variant="ghost"
													aria-label="Remove Dependency"
													className="hover:text-destructive"
													onClick={
														headerActions.onRemove
													}
												>
													<Trash2 aria-hidden="true" />
												</Button>
											</MapTooltip>
										</>
									)}
								</ButtonGroup>
							) : null}
						</div>
						<AccordionContent>
							<ul className="flex flex-col gap-4">
								{ownLinks.map(({ edge }, index) => {
									const owner =
										graph.nodes.get(edge.source) ?? node;
									const place = getConfigurationPlace(
										edge.role,
										owner,
									);
									// only the owner's editors get a link to
									// its settings; a dependent's are not known
									const placePath =
										canEditOwner &&
										owner.id === graph.rootId
											? place.path
											: null;
									// the owner's own manual link is the one
									// the edit acts on
									const actions =
										!edge.isAutomatic &&
										owner.id === graph.rootId
											? linkActions
											: undefined;
									return (
										<li
											key={edge.id}
											className="flex flex-col gap-4"
										>
											{index > 0 ? <Separator /> : null}
											<dl
												className={cn(
													DRAWER_FACTS_CLASS,
													actions?.isRemoved &&
														"opacity-60",
												)}
											>
												<div
													className={
														DRAWER_FACT_CLASS
													}
												>
													<dt
														className={
															DRAWER_FACT_LABEL_CLASS
														}
													>
														Type
													</dt>
													<dd
														className={
															DRAWER_FACT_VALUE_CLASS
														}
													>
														<DependencyKindBadge
															isAutomatic={
																edge.isAutomatic
															}
														/>
													</dd>
												</div>
												{edge.isAutomatic ? (
													<div
														className={
															DRAWER_FACT_CLASS
														}
													>
														<dt
															className={
																DRAWER_FACT_LABEL_CLASS
															}
														>
															Role
														</dt>
														<dd
															className={cn(
																DRAWER_FACT_VALUE_CLASS,
																"font-medium",
															)}
														>
															{getDependencyRoleLabel(
																edge.role,
															)}
														</dd>
													</div>
												) : (
													<div
														className={
															DRAWER_FACT_CLASS
														}
													>
														<dt
															className={
																DRAWER_FACT_LABEL_CLASS
															}
														>
															Name
														</dt>
														<dd
															className={
																DRAWER_FACT_VALUE_CLASS
															}
														>
															{edge.name ? (
																edge.name
															) : (
																<span
																	className={
																		DRAWER_NOTE_CLASS
																	}
																>
																	No name
																</span>
															)}
															{problem &&
															owner.id ===
																graph.rootId ? (
																<span className="mt-1 flex items-center gap-1 text-destructive text-xs">
																	<TriangleAlert
																		className="size-3.5 shrink-0"
																		aria-hidden="true"
																	/>
																	{problem}
																</span>
															) : null}
														</dd>
													</div>
												)}
												<div
													className={
														DRAWER_WIDE_FACT_CLASS
													}
												>
													<dt
														className={
															DRAWER_FACT_LABEL_CLASS
														}
													>
														Description
													</dt>
													<dd
														className={
															DRAWER_FACT_VALUE_CLASS
														}
													>
														{edge.description ? (
															edge.description
														) : (
															<span
																className={
																	DRAWER_NOTE_CLASS
																}
															>
																{edge.isAutomatic
																	? describeAutomaticLink(
																			owner.type,
																		)
																	: "No description"}
															</span>
														)}
													</dd>
												</div>
												{edge.isAutomatic ? (
													<div
														className={
															DRAWER_WIDE_FACT_CLASS
														}
													>
														<dt
															className={
																DRAWER_FACT_LABEL_CLASS
															}
														>
															Changed In
														</dt>
														<dd
															className={
																DRAWER_FACT_VALUE_CLASS
															}
														>
															{placePath ? (
																<Button
																	asChild
																	variant="link"
																	className="h-auto p-0"
																>
																	<Link
																		to={
																			placePath
																		}
																	>
																		{`${owner.name}'s ${place.label}`}
																	</Link>
																</Button>
															) : (
																`${owner.name}'s ${place.label}`
															)}
															<span className="block text-muted-foreground text-xs">
																Read-Only Here
															</span>
														</dd>
													</div>
												) : null}
											</dl>
											{actions?.isRemoved ? (
												<P
													className={
														DRAWER_NOTE_CLASS
													}
												>
													Removed when you save
												</P>
											) : null}
										</li>
									);
								})}
							</ul>
						</AccordionContent>
					</AccordionItem>
				) : null}
				<DrawerLineage
					upstreamCount={uses.length}
					downstreamCount={usedBy.length}
					upstream={renderLinks(uses)}
					downstream={renderLinks(usedBy)}
				/>
			</Accordion>
		</DependencyDrawer>
	);
};
