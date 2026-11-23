import {
	ArrowDown,
	ArrowUp,
	ExternalLink,
	Lock,
	LockKeyhole,
	Network,
	TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";
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
	Muted,
	P,
} from "@semoss/ui/next";
import { ResourceId } from "@/components/shared/resource-id";
import { DependencyDrawer } from "@/features/dependency-map/dependency-drawer";
import { DependencyItemImage } from "@/features/dependency-map/dependency-item-image";
import { DrawerItemMeta } from "@/features/dependency-map/drawer-item-meta";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";
import {
	canRequestDependency,
	DEPENDENCY_ACCESS_LEVEL_LABELS,
	getDependencyTypeConfig,
	getDependencyVisibilityLabel,
} from "./catalog-dependency";
import {
	type CatalogDependencyGraph,
	type CatalogGraphNode,
	type GraphNodeLink,
	getGraphNodePaths,
	getNodeLinks,
} from "./catalog-dependency-graph";
import { DependencyAccessBadge } from "./dependency-access-badge";
import { DependencyLinkRow } from "./dependency-link-row";

/** Props for {@link CatalogDependencyDrawer}. */
interface CatalogDependencyDrawerProps {
	/** The owner's graph */
	graph: CatalogDependencyGraph;
	/** The item open in the drawer */
	node: CatalogGraphNode;
	/** Closes the drawer, putting focus back on the item it showed */
	onClose: () => void;
	/** Opens another item of the graph in the drawer */
	onSelect: (id: string) => void;
	/** Asks for access to the item */
	onRequestAccess: (node: CatalogGraphNode) => void;
	/** Shown above the details, such as the link's form while links are edited */
	children?: ReactNode;
}

/**
 * The details of one item of an Ontology tab, in a drawer beside the canvas,
 * built as the admin Ontology's drawer is. The header holds the item's image,
 * name, type and visibility, and its actions as icon buttons with tooltips:
 * Request Access, View Its Ontology, Open in Catalog, and Close. The item then
 * folds into Overview (its id, description and anything the user should know)
 * and Lineage (what it uses and what uses it, each link with its role and why
 * it exists, each item opening here in turn). A private item says only its
 * type, and how to get access. Its heading takes focus when it opens. While
 * the owner's links are edited, a manual link's form sits above the details.
 */
export const CatalogDependencyDrawer = ({
	graph,
	node,
	onClose,
	onSelect,
	onRequestAccess,
	children,
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

	const renderLinks = (links: readonly GraphNodeLink[]) =>
		links.length === 0 ? (
			<Muted>None</Muted>
		) : (
			<ul className="divide-y">
				{links.map((link) => (
					<DependencyLinkRow
						key={link.edge.id}
						{...link}
						onSelect={onSelect}
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
										rel="noreferrer"
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
			{children ? <div className="pt-4">{children}</div> : null}
			{/* a new key per item, so each opens on its overview */}
			<Accordion
				key={node.id}
				type="multiple"
				defaultValue={["overview"]}
			>
				<AccordionItem value="overview">
					<AccordionTrigger>Overview</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4">
						{isPlaceholder || node.isPrivate ? null : (
							<ResourceId id={node.id} name={node.name} />
						)}
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
						) : node.description ? (
							<P className="text-muted-foreground text-sm">
								{node.description}
							</P>
						) : (
							<Muted>
								{node.side === "USED_BY" || isRoot
									? "Open it to read its description."
									: "No description."}
							</Muted>
						)}
						{relation ? <Muted>{relation}</Muted> : null}
						{access?.kind === "granted" && access.requested ? (
							<Muted>{`You asked for ${DEPENDENCY_ACCESS_LEVEL_LABELS[access.requested]} access. It waits on its owners.`}</Muted>
						) : null}
						{access?.kind === "requested" ? (
							<Muted>
								Your request waits on its owners. Open it to
								change or withdraw the request.
							</Muted>
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
				<AccordionItem value="lineage">
					<AccordionTrigger
						aria-label={`Lineage, ${uses.length} upstream, ${usedBy.length} downstream`}
					>
						<span className="flex items-center gap-2">
							Lineage
							<Badge variant="secondary" className="gap-0.5">
								<ArrowUp
									className="size-3"
									aria-hidden="true"
								/>
								{uses.length}
							</Badge>
							<Badge variant="secondary" className="gap-0.5">
								<ArrowDown
									className="size-3"
									aria-hidden="true"
								/>
								{usedBy.length}
							</Badge>
						</span>
					</AccordionTrigger>
					<AccordionContent className="flex flex-col gap-4">
						<section
							aria-label="Upstream"
							className="flex flex-col gap-1"
						>
							<p className="font-medium text-sm">Upstream</p>
							{renderLinks(uses)}
						</section>
						<section
							aria-label="Downstream"
							className="flex flex-col gap-1"
						>
							<p className="font-medium text-sm">Downstream</p>
							{renderLinks(usedBy)}
						</section>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</DependencyDrawer>
	);
};
